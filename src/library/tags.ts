const TAG_SEPARATOR = ',';
const TAG_DISPLAY_SEPARATOR = ', ';
const MAX_TAG_SUGGESTIONS = 8;

interface PendingTagSplit {
  readonly completedTags: string;
  readonly pendingTag: string;
}

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

export function suggestTags(knownTags: readonly string[], tagsText: string): string[] {
  const { completedTags, pendingTag } = splitPendingTag(tagsText);
  const enteredTagKeys = new Set([...parseTags(completedTags), pendingTag].map(tagKey));
  const pendingTagKey = tagKey(pendingTag);
  const matchingTags = knownTags.filter(
    (tag) => !enteredTagKeys.has(tagKey(tag)) && tagKey(tag).includes(pendingTagKey),
  );
  const startsWithPendingTag = (tag: string): boolean => tagKey(tag).startsWith(pendingTagKey);
  return [
    ...matchingTags.filter(startsWithPendingTag),
    ...matchingTags.filter((tag) => !startsWithPendingTag(tag)),
  ].slice(0, MAX_TAG_SUGGESTIONS);
}

export function completeTag(tagsText: string, tag: string): string {
  const { completedTags } = splitPendingTag(tagsText);
  return `${formatTags(uniqueTags([...parseTags(completedTags), tag]))}${TAG_DISPLAY_SEPARATOR}`;
}

function splitPendingTag(tagsText: string): PendingTagSplit {
  const pendingTagStart = tagsText.lastIndexOf(TAG_SEPARATOR) + 1;
  return {
    completedTags: tagsText.slice(0, pendingTagStart),
    pendingTag: tagsText.slice(pendingTagStart).trim(),
  };
}
