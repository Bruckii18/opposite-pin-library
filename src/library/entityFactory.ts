import { pinSetIdSchema, savedPinIdSchema, type PinSetId, type SavedPinId } from './librarySchema';

export interface EntityFactory {
  newPinId(): SavedPinId;
  newSetId(): PinSetId;
  timestamp(): string;
}

export const browserEntityFactory: EntityFactory = {
  newPinId: () => savedPinIdSchema.parse(crypto.randomUUID()),
  newSetId: () => pinSetIdSchema.parse(crypto.randomUUID()),
  timestamp: () => new Date().toISOString(),
};
