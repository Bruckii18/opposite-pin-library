import { libraryEntryIdSchema, type LibraryEntryId } from './librarySchema';

export interface EntityFactory {
  newEntryId(): LibraryEntryId;
  timestamp(): string;
}

export const browserEntityFactory: EntityFactory = {
  newEntryId: () => libraryEntryIdSchema.parse(crypto.randomUUID()),
  timestamp: () => new Date().toISOString(),
};
