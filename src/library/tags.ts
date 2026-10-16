const TAG_SEPARATOR = ',';
const TAG_DISPLAY_SEPARATOR = ', ';

export function parseTags(text: string): string[] {
  return uniqueTags(text.split(TAG_SEPARATOR).map((part) => part.trim()).filter((tag) => tag !== ''));
}

export function formatTags(tags: readonly string[]): string {
  return tags.join(TAG_DISPLAY_SEPARATOR);
}

export function uniqueTags(tags: readonly string[]): string[] {
  const tagsByKey = new Map<string, string>();
  for (const tag of tags) {
    if (!tagsByKey.has(tagKey(tag))) {
      tagsByKey.set(tagKey(tag), tag);
    }
  }
  return [...tagsByKey.values()];
}

export function tagKey(tag: string): string {
  return tag.toLowerCase();
}
