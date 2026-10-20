import { describePin } from '../wcl/pinString';
import type { LibraryEntry } from './librarySchema';
import { tagKey, uniqueTags } from './tags';

export interface LibraryFilter {
  readonly text: string;
  readonly tags: readonly string[];
}

interface Taggable {
  readonly tags: readonly string[];
}

const WHITESPACE = /\s+/;

export const EMPTY_FILTER: LibraryFilter = { text: '', tags: [] };

export function filterEntries(entries: readonly LibraryEntry[], filter: LibraryFilter): LibraryEntry[] {
  return entries.filter((entry) =>
    matchesFilter(entry, filter, [
      entry.name,
      entry.description,
      ...entry.pins.map((pin) => describePin(pin).summary),
    ]),
  );
}

export function collectTags(entries: readonly Taggable[]): string[] {
  return uniqueTags(entries.flatMap((entry) => entry.tags)).sort((first, second) =>
    first.localeCompare(second),
  );
}

export function collectTagsByUsage(entries: readonly Taggable[]): string[] {
  const usageByTagKey = new Map<string, number>();
  for (const tag of entries.flatMap((entry) => entry.tags)) {
    usageByTagKey.set(tagKey(tag), (usageByTagKey.get(tagKey(tag)) ?? 0) + 1);
  }
  const usageOf = (tag: string): number => usageByTagKey.get(tagKey(tag)) ?? 0;
  return collectTags(entries).sort((first, second) => usageOf(second) - usageOf(first));
}

export function toggleFilterTag(filter: LibraryFilter, tag: string): LibraryFilter {
  const isSelected = filter.tags.some((selectedTag) => tagKey(selectedTag) === tagKey(tag));
  return {
    ...filter,
    tags: isSelected
      ? filter.tags.filter((selectedTag) => tagKey(selectedTag) !== tagKey(tag))
      : [...filter.tags, tag],
  };
}

function matchesFilter(
  entry: Taggable,
  filter: LibraryFilter,
  searchableTexts: readonly string[],
): boolean {
  const entryTagKeys = entry.tags.map(tagKey);
  const haystack = [...searchableTexts, ...entryTagKeys].join(' ').toLowerCase();
  const hasAllSelectedTags = filter.tags.every((tag) => entryTagKeys.includes(tagKey(tag)));
  return hasAllSelectedTags && searchTerms(filter.text).every((term) => haystack.includes(term));
}

function searchTerms(text: string): string[] {
  return text
    .toLowerCase()
    .split(WHITESPACE)
    .filter((term) => term !== '');
}
