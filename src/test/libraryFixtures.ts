import type { EntityFactory } from '../library/entityFactory';
import type { PinDraft } from '../library/libraryOperations';
import { pinSetIdSchema, savedPinIdSchema } from '../library/librarySchema';
import type { PinString } from '../wcl/pinString';

export const FIXED_TIMESTAMP = '2026-10-16T12:00:00.000Z';

export function createSequentialFactory(): EntityFactory {
  let sequence = 0;
  return {
    newPinId: () => savedPinIdSchema.parse(`pin-${(sequence += 1)}`),
    newSetId: () => pinSetIdSchema.parse(`set-${(sequence += 1)}`),
    timestamp: () => FIXED_TIMESTAMP,
  };
}

export function pinDraft(name: string, pinString: PinString, tags: readonly string[] = []): PinDraft {
  return { name, description: '', tags, pinString };
}

export function requireDefined<Value>(value: Value | undefined): Value {
  if (value === undefined) {
    throw new Error('Test fixture is missing an expected value.');
  }
  return value;
}
