import { describe, expect, it } from 'vitest';
import { createSequentialFactory, entryDraft, requireDefined } from '../test/libraryFixtures';
import { CAST_FILTER, DEATH_BADGE, MOONFIRE_DECORATOR } from '../test/pinFixtures';
import type { EntityFactory } from './entityFactory';
import {
  addEntry,
  deleteEntry,
  duplicateEntry,
  findGroupsContainingPin,
  findSinglePinEntry,
  namePinsBySinglePinEntries,
  updateEntry,
} from './libraryOperations';
import { createEmptyLibrary, type PinLibrary } from './librarySchema';

function libraryWithEntries(factory: EntityFactory): PinLibrary {
  return [
    entryDraft('Moonfire', [MOONFIRE_DECORATOR]),
    entryDraft('DMG AMP onward', [DEATH_BADGE]),
    entryDraft('Coiled Altar', [DEATH_BADGE, CAST_FILTER]),
  ].reduce((library, draft) => addEntry(library, draft, factory), createEmptyLibrary());
}

describe('library operations', () => {
  it('adds entries with generated ids and timestamps, whether they hold one pin or several', () => {
    const library = libraryWithEntries(createSequentialFactory());

    expect(library.entries.map((entry) => [entry.id, entry.name, entry.pins.length])).toEqual([
      ['entry-1', 'Moonfire', 1],
      ['entry-2', 'DMG AMP onward', 1],
      ['entry-3', 'Coiled Altar', 2],
    ]);
    expect(library.entries[0]?.createdAt).toBe('2026-10-16T12:00:00.000Z');
  });

  it('stores every pin of an entry once', () => {
    const library = addEntry(
      createEmptyLibrary(),
      entryDraft('Raid', [DEATH_BADGE, CAST_FILTER, DEATH_BADGE]),
      createSequentialFactory(),
    );

    expect(library.entries[0]?.pins).toEqual([DEATH_BADGE, CAST_FILTER]);
  });

  it('updates only the targeted entry', () => {
    const factory = createSequentialFactory();
    const library = libraryWithEntries(factory);
    const [moonfire, deaths] = library.entries;

    const updated = updateEntry(
      library,
      requireDefined(moonfire).id,
      entryDraft('Moonfire and casts', [MOONFIRE_DECORATOR, CAST_FILTER], ['druid']),
      factory,
    );

    expect(updated.entries[0]).toMatchObject({
      id: moonfire?.id,
      name: 'Moonfire and casts',
      pins: [MOONFIRE_DECORATOR, CAST_FILTER],
      tags: ['druid'],
    });
    expect(updated.entries[1]).toBe(deaths);
  });

  it('deletes an entry without touching the others', () => {
    const library = libraryWithEntries(createSequentialFactory());

    const result = deleteEntry(library, requireDefined(library.entries[2]).id);

    expect(result.entries.map((entry) => entry.name)).toEqual(['Moonfire', 'DMG AMP onward']);
  });

  it('duplicates an entry under a new id with a copy name', () => {
    const factory = createSequentialFactory();
    const library = libraryWithEntries(factory);
    const original = requireDefined(library.entries[2]);

    const result = duplicateEntry(library, original.id, factory);

    expect(result.entries[3]).toMatchObject({ name: 'Coiled Altar (copy)', pins: original.pins });
    expect(result.entries[3]?.id).not.toBe(original.id);
  });

  it('finds the entry that saves exactly one pin and the groups that contain it', () => {
    const { entries } = libraryWithEntries(createSequentialFactory());

    expect(findSinglePinEntry(entries, DEATH_BADGE)?.name).toBe('DMG AMP onward');
    expect(findSinglePinEntry(entries, CAST_FILTER)).toBeUndefined();
    expect(findGroupsContainingPin(entries, CAST_FILTER).map((entry) => entry.name)).toEqual(['Coiled Altar']);
    expect(findGroupsContainingPin(entries, MOONFIRE_DECORATOR)).toEqual([]);
  });

  it('names pins after the first one-pin entry that saves them', () => {
    const factory = createSequentialFactory();
    const library = addEntry(libraryWithEntries(factory), entryDraft('Deaths again', [DEATH_BADGE]), factory);

    const namesByPin = namePinsBySinglePinEntries(library.entries);

    expect(namesByPin.get(DEATH_BADGE)).toBe('DMG AMP onward');
    expect(namesByPin.get(MOONFIRE_DECORATOR)).toBe('Moonfire');
    expect(namesByPin.has(CAST_FILTER)).toBe(false);
  });
});
