import { describe, expect, it } from 'vitest';
import { createSequentialFactory, pinDraft } from '../test/libraryFixtures';
import { CAST_FILTER, DEATH_BADGE, MOONFIRE_DECORATOR } from '../test/pinFixtures';
import { addPin } from './libraryOperations';
import { createEmptyLibrary, type SavedPin } from './librarySchema';
import { collectTags, EMPTY_FILTER, filterPins, toggleFilterTag } from './librarySearch';

function savedPins(): SavedPin[] {
  const factory = createSequentialFactory();
  return [
    pinDraft('Moonfire uptime', MOONFIRE_DECORATOR, ['Druid', 'dps']),
    pinDraft('Raid deaths', DEATH_BADGE, ['raid']),
    pinDraft('Casts', CAST_FILTER, ['DPS', 'raid']),
  ].reduce((library, draft) => addPin(library, draft, factory), createEmptyLibrary()).pins;
}

const names = (pins: readonly SavedPin[]) => pins.map((pin) => pin.name);

describe('filterPins', () => {
  it('returns every pin for an empty filter', () => {
    expect(names(filterPins(savedPins(), EMPTY_FILTER))).toHaveLength(3);
  });

  it('matches every search term against names, tags and the pin expression', () => {
    expect(names(filterPins(savedPins(), { text: 'raid DEATH', tags: [] }))).toEqual(['Raid deaths']);
    expect(names(filterPins(savedPins(), { text: 'moonfire', tags: [] }))).toEqual(['Moonfire uptime']);
    expect(names(filterPins(savedPins(), { text: '"cast"', tags: [] }))).toEqual(['Casts']);
  });

  it('requires all selected tags, ignoring case', () => {
    expect(names(filterPins(savedPins(), { text: '', tags: ['dps', 'RAID'] }))).toEqual(['Casts']);
  });
});

describe('tag helpers', () => {
  it('collects unique tags sorted alphabetically', () => {
    expect(collectTags(savedPins())).toEqual(['dps', 'Druid', 'raid']);
  });

  it('toggles a tag in the filter regardless of case', () => {
    const withTag = toggleFilterTag(EMPTY_FILTER, 'raid');

    expect(withTag.tags).toEqual(['raid']);
    expect(toggleFilterTag(withTag, 'RAID').tags).toEqual([]);
  });
});
