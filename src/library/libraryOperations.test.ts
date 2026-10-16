import { describe, expect, it } from 'vitest';
import type { EntityFactory } from './entityFactory';
import { createSequentialFactory, pinDraft, requireDefined } from '../test/libraryFixtures';
import { CAST_FILTER, DEATH_BADGE, MOONFIRE_DECORATOR } from '../test/pinFixtures';
import {
  addPin,
  addPinsAsSet,
  addSet,
  deletePin,
  duplicatePin,
  duplicateSet,
  findPinByPinString,
  resolveSetPins,
  updatePin,
} from './libraryOperations';
import { createEmptyLibrary, type PinLibrary } from './librarySchema';

function libraryWithTwoPins(factory: EntityFactory): PinLibrary {
  const withMoonfire = addPin(createEmptyLibrary(), pinDraft('Moonfire', MOONFIRE_DECORATOR), factory);
  return addPin(withMoonfire, pinDraft('Deaths', DEATH_BADGE), factory);
}

describe('library operations', () => {
  it('adds pins with generated ids and timestamps', () => {
    const library = libraryWithTwoPins(createSequentialFactory());

    expect(library.pins.map((pin) => [pin.id, pin.name])).toEqual([
      ['pin-1', 'Moonfire'],
      ['pin-2', 'Deaths'],
    ]);
    expect(library.pins[0]?.createdAt).toBe('2026-10-16T12:00:00.000Z');
  });

  it('updates only the targeted pin', () => {
    const factory = createSequentialFactory();
    const library = libraryWithTwoPins(factory);
    const [moonfire, deaths] = library.pins;

    const updated = updatePin(
      library,
      requireDefined(moonfire).id,
      pinDraft('Moonfire uptime', CAST_FILTER, ['druid']),
      factory,
    );

    expect(updated.pins[0]).toMatchObject({ name: 'Moonfire uptime', pinString: CAST_FILTER, tags: ['druid'] });
    expect(updated.pins[1]).toBe(deaths);
  });

  it('removes a deleted pin from every set that used it', () => {
    const factory = createSequentialFactory();
    const library = libraryWithTwoPins(factory);
    const [moonfireId, deathsId] = library.pins.map((pin) => pin.id);
    const withSet = addSet(
      library,
      { name: 'Raid', description: '', tags: [], pinIds: library.pins.map((pin) => pin.id) },
      factory,
    );

    const result = deletePin(withSet, requireDefined(moonfireId));

    expect(result.pins).toHaveLength(1);
    expect(result.sets[0]?.pinIds).toEqual([deathsId]);
  });

  it('duplicates pins and sets under a new id with a copy name', () => {
    const factory = createSequentialFactory();
    const library = libraryWithTwoPins(factory);
    const original = requireDefined(library.pins[0]);

    const withPinCopy = duplicatePin(library, original.id, factory);
    const withSet = addSet(
      withPinCopy,
      { name: 'Raid', description: '', tags: [], pinIds: [original.id] },
      factory,
    );
    const withSetCopy = duplicateSet(withSet, requireDefined(withSet.sets[0]).id, factory);

    expect(withPinCopy.pins[2]).toMatchObject({ name: 'Moonfire (copy)', pinString: original.pinString });
    expect(withPinCopy.pins[2]?.id).not.toBe(original.id);
    expect(withSetCopy.sets.map((set) => set.name)).toEqual(['Raid', 'Raid (copy)']);
    expect(withSetCopy.sets[1]?.pinIds).toEqual([original.id]);
  });

  it('saves active pins as a set, reusing pins that are already saved', () => {
    const factory = createSequentialFactory();
    const library = libraryWithTwoPins(factory);

    const result = addPinsAsSet(
      library,
      [DEATH_BADGE, CAST_FILTER],
      { name: 'Progression', description: 'Mythic', tags: ['raid'] },
      factory,
    );

    const savedSet = requireDefined(result.sets[0]);
    expect(result.pins).toHaveLength(3);
    expect(findPinByPinString(result.pins, CAST_FILTER)?.name).toBe('Filter: type = "cast"');
    expect(savedSet).toMatchObject({ name: 'Progression', description: 'Mythic', tags: ['raid'] });
    expect(resolveSetPins(result, savedSet).map((pin) => pin.pinString)).toEqual([DEATH_BADGE, CAST_FILTER]);
  });
});
