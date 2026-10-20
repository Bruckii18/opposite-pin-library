import { z } from 'zod';
import { CURRENT_SCHEMA_VERSION, createEmptyLibrary, pinLibrarySchema, type PinLibrary } from './librarySchema';

export class UnreadableLibraryError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'UnreadableLibraryError';
  }
}

const versionedSchema = z.looseObject({ schemaVersion: z.number().int() });

type VersionedData = z.infer<typeof versionedSchema>;
type Migration = (data: VersionedData) => VersionedData;

const addOptionalViewParams: Migration = (data) => ({ ...data, schemaVersion: 2 });

const MIGRATIONS_BY_SOURCE_VERSION: ReadonlyMap<number, Migration> = new Map([[1, addOptionalViewParams]]);

export function readStoredLibrary(storedValue: unknown): PinLibrary {
  if (storedValue === undefined) {
    return createEmptyLibrary();
  }
  const parsed = pinLibrarySchema.safeParse(migrateToCurrentVersion(storedValue));
  if (!parsed.success) {
    throw new UnreadableLibraryError(
      `The saved pin library is damaged: ${z.prettifyError(parsed.error)}`,
      { cause: parsed.error },
    );
  }
  return parsed.data;
}

export function migrateToCurrentVersion(value: unknown): VersionedData {
  return applyMigrations(requireSupportedVersion(value));
}

function requireSupportedVersion(value: unknown): VersionedData {
  const versioned = versionedSchema.safeParse(value);
  if (!versioned.success) {
    throw new UnreadableLibraryError('The data has no valid schema version.', { cause: versioned.error });
  }
  if (versioned.data.schemaVersion > CURRENT_SCHEMA_VERSION) {
    throw new UnreadableLibraryError(
      `The data uses schema version ${versioned.data.schemaVersion}, but this extension only reads up to version ${CURRENT_SCHEMA_VERSION}. Update the extension.`,
    );
  }
  return versioned.data;
}

function applyMigrations(data: VersionedData): VersionedData {
  const migrate = MIGRATIONS_BY_SOURCE_VERSION.get(data.schemaVersion);
  return migrate === undefined ? data : applyMigrations(migrate(data));
}
