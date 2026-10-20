import { describe, expect, it } from 'vitest';
import { createSequentialFactory, entryDraft, requireDefined } from '../test/libraryFixtures';
import { CAST_FILTER, DEATH_BADGE } from '../test/pinFixtures';
import { entryApplyTarget } from './applyTargets';
import { addEntry } from './libraryOperations';
import { createEmptyLibrary } from './librarySchema';

function savedEntry(viewParams?: { readonly tab: 'casts' }) {
  const library = addEntry(
    createEmptyLibrary(),
    { ...entryDraft('Raid', [DEATH_BADGE, CAST_FILTER]), viewParams },
    createSequentialFactory(),
  );
  return requireDefined(library.entries[0]);
}

describe('entryApplyTarget', () => {
  it('applies every pin of the entry together with its saved view', () => {
    expect(entryApplyTarget(savedEntry({ tab: 'casts' }))).toEqual({
      pins: [DEATH_BADGE, CAST_FILTER],
      viewParams: { tab: 'casts' },
    });
  });

  it('keeps the current view for an entry without a saved view', () => {
    expect(entryApplyTarget(savedEntry()).viewParams).toBeNull();
  });
});
