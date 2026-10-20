import type { EntityFactory } from '../library/entityFactory';
import type { EntryDraft } from '../library/libraryOperations';
import { libraryEntryIdSchema } from '../library/librarySchema';
import type { PinString } from '../wcl/pinString';

export const FIXED_TIMESTAMP = '2026-10-16T12:00:00.000Z';

export function createSequentialFactory(): EntityFactory {
  let sequence = 0;
  return {
    newEntryId: () => libraryEntryIdSchema.parse(`entry-${(sequence += 1)}`),
    timestamp: () => FIXED_TIMESTAMP,
  };
}

export function entryDraft(name: string, pins: readonly PinString[], tags: readonly string[] = []): EntryDraft {
  return { name, description: '', tags, pins };
}

export function requireDefined<Value>(value: Value | undefined): Value {
  if (value === undefined) {
    throw new Error('Test fixture is missing an expected value.');
  }
  return value;
}
