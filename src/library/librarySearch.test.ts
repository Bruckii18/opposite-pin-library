import { describe, expect, it } from 'vitest';
import { createSequentialFactory, entryDraft } from '../test/libraryFixtures';
import { CAST_FILTER, DEATH_BADGE, MOONFIRE_DECORATOR } from '../test/pinFixtures';
import { addEntry } from './libraryOperations';
import { createEmptyLibrary, type LibraryEntry } from './librarySchema';
import { collectTags, collectTagsByUsage, EMPTY_FILTER, filterEntries, toggleFilterTag } from './librarySearch';

function savedEntries(): LibraryEntry[] {
  const factory = createSequentialFactory();
  return [
    entryDraft('Moonfire uptime', [MOONFIRE_DECORATOR], ['Druid', 'dps']),
    entryDraft('Raid deaths', [DEATH_BADGE], ['raid']),
    entryDraft('Prog review', [CAST_FILTER, DEATH_BADGE], ['DPS', 'raid']),
  ].reduce((library, draft) => addEntry(library, draft, factory), createEmptyLibrary()).entries;
}

const names = (entries: readonly LibraryEntry[]) => entries.map((entry) => entry.name);

describe('filterEntries', () => {
  it('returns every entry for an empty filter', () => {
    expect(names(filterEntries(savedEntries(), EMPTY_FILTER))).toHaveLength(3);
  });

  it('matches every search term against names, tags and every pin expression', () => {
    expect(names(filterEntries(savedEntries(), { text: 'raid DEATH', tags: [] }))).toEqual([
      'Raid deaths',
      'Prog review',
    ]);
    expect(names(filterEntries(savedEntries(), { text: 'moonfire', tags: [] }))).toEqual(['Moonfire uptime']);
    expect(names(filterEntries(savedEntries(), { text: '"cast"', tags: [] }))).toEqual(['Prog review']);
  });

  it('requires all selected tags, ignoring case', () => {
    expect(names(filterEntries(savedEntries(), { text: '', tags: ['dps', 'RAID'] }))).toEqual(['Prog review']);
  });
});

describe('tag helpers', () => {
  it('collects unique tags sorted alphabetically', () => {
    expect(collectTags(savedEntries())).toEqual(['dps', 'Druid', 'raid']);
  });

  it('orders tags by how often they are used, then alphabetically', () => {
    expect(collectTagsByUsage(savedEntries())).toEqual(['dps', 'raid', 'Druid']);
  });

  it('toggles a tag in the filter regardless of case', () => {
    const withTag = toggleFilterTag(EMPTY_FILTER, 'raid');

    expect(withTag.tags).toEqual(['raid']);
    expect(toggleFilterTag(withTag, 'RAID').tags).toEqual([]);
  });
});
