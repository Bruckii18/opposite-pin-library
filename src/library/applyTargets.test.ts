import { describe, expect, it } from 'vitest';
import { createSequentialFactory, pinDraft, requireDefined } from '../test/libraryFixtures';
import { CAST_FILTER, DEATH_BADGE, MOONFIRE_DECORATOR } from '../test/pinFixtures';
import type { ViewParams } from '../wcl/viewParams';
import { pinApplyTarget, setApplyTarget } from './applyTargets';
import { addPin, addSet, resolveSetPins } from './libraryOperations';
import { createEmptyLibrary, type PinLibrary } from './librarySchema';

const CASTS: ViewParams = { type: 'casts' };
const DAMAGE_TAKEN: ViewParams = { type: 'damage-taken', ability: '1304424' };

function libraryWithSet(pinViews: readonly (ViewParams | undefined)[], setView: ViewParams | undefined): PinLibrary {
  const factory = createSequentialFactory();
  const pinStrings = [MOONFIRE_DECORATOR, DEATH_BADGE, CAST_FILTER];
  const withPins = pinViews.reduce<PinLibrary>(
    (library, viewParams, index) =>
      addPin(library, { ...pinDraft(`Pin ${index + 1}`, requireDefined(pinStrings[index])), viewParams }, factory),
    createEmptyLibrary(),
  );
  return addSet(
    withPins,
    { name: 'Raid', description: '', tags: [], pinIds: withPins.pins.map((pin) => pin.id), viewParams: setView },
    factory,
  );
}

function targetForSet(library: PinLibrary) {
  const set = requireDefined(library.sets[0]);
  return setApplyTarget(set, resolveSetPins(library, set));
}

describe('apply targets', () => {
  it('keeps the current view when no item has a saved view', () => {
    const target = targetForSet(libraryWithSet([undefined, undefined], undefined));

    expect(target).toEqual({
      pins: [MOONFIRE_DECORATOR, DEATH_BADGE],
      view: { viewParams: null, conflictWinnerName: null },
    });
  });

  it('applies the saved view of a single pin', () => {
    const pin = requireDefined(libraryWithSet([CASTS], undefined).pins[0]);

    expect(pinApplyTarget(pin).view).toEqual({ viewParams: CASTS, conflictWinnerName: null });
  });

  it('lets the last item with a saved view win and reports the conflict', () => {
    const target = targetForSet(libraryWithSet([CASTS, undefined, DAMAGE_TAKEN], undefined));

    expect(target.view).toEqual({ viewParams: DAMAGE_TAKEN, conflictWinnerName: 'Pin 3' });
  });

  it('applies the set view last, so it wins over the views of its pins', () => {
    const target = targetForSet(libraryWithSet([CASTS, DAMAGE_TAKEN], { type: 'deaths' }));

    expect(target.view).toEqual({ viewParams: { type: 'deaths' }, conflictWinnerName: 'Raid' });
  });

  it('does not report a conflict when all saved views are the same', () => {
    const target = targetForSet(libraryWithSet([CASTS, undefined], { ...CASTS }));

    expect(target.view).toEqual({ viewParams: CASTS, conflictWinnerName: null });
  });
});
