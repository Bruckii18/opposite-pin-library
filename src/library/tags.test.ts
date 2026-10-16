import { describe, expect, it } from 'vitest';
import { formatTags, parseTags } from './tags';

describe('parseTags', () => {
  it('splits on commas, trims and drops case-insensitive duplicates', () => {
    expect(parseTags(' healer, Mythic ,,healer, mythic ')).toEqual(['healer', 'Mythic']);
  });

  it('round-trips through formatTags', () => {
    expect(parseTags(formatTags(['a', 'b c']))).toEqual(['a', 'b c']);
  });
});
