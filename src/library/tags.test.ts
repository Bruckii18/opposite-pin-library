import { describe, expect, it } from 'vitest';
import { completeTag, formatTags, parseTags, suggestTags } from './tags';

describe('parseTags', () => {
  it('splits on commas, trims and drops case-insensitive duplicates', () => {
    expect(parseTags(' healer, Mythic ,,healer, mythic ')).toEqual(['healer', 'Mythic']);
  });

  it('round-trips through formatTags', () => {
    expect(parseTags(formatTags(['a', 'b c']))).toEqual(['a', 'b c']);
  });
});

describe('suggestTags', () => {
  const KNOWN_TAGS = ['raid', 'prog-mythic', 'healer', 'Mythic', 'dps'];

  it('suggests every known tag in the given order while the field is empty', () => {
    expect(suggestTags(KNOWN_TAGS, '')).toEqual(KNOWN_TAGS);
  });

  it('filters by the tag being typed and puts prefix matches first', () => {
    expect(suggestTags(KNOWN_TAGS, 'raid, myth')).toEqual(['Mythic', 'prog-mythic']);
  });

  it('leaves out tags that are already entered, regardless of case', () => {
    expect(suggestTags(KNOWN_TAGS, 'RAID, Healer, ')).toEqual(['prog-mythic', 'Mythic', 'dps']);
    expect(suggestTags(KNOWN_TAGS, 'dps')).toEqual([]);
  });

  it('suggests nothing for a new tag that matches no known tag', () => {
    expect(suggestTags(KNOWN_TAGS, 'raid, tank')).toEqual([]);
  });

  it('suggests at most eight tags', () => {
    const manyTags = Array.from({ length: 12 }, (_, index) => `tag-${index}`);

    expect(suggestTags(manyTags, '')).toHaveLength(8);
  });
});

describe('completeTag', () => {
  it('replaces the tag being typed and leaves room for the next one', () => {
    expect(completeTag('raid, myth', 'Mythic')).toBe('raid, Mythic, ');
    expect(completeTag('', 'raid')).toBe('raid, ');
    expect(completeTag('raid,healer ,  ', 'dps')).toBe('raid, healer, dps, ');
  });

  it('round-trips into the saved tags', () => {
    expect(parseTags(completeTag('raid, he', 'healer'))).toEqual(['raid', 'healer']);
  });
});
