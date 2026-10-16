import { z } from 'zod';
import { CURRENT_SCHEMA_VERSION, createEmptyLibrary, pinLibrarySchema, type PinLibrary } from './librarySchema';

export class UnreadableLibraryError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'UnreadableLibraryError';
  }
}

const versionedSchema = z.object({ schemaVersion: z.number().int() });

export function readStoredLibrary(storedValue: unknown): PinLibrary {
  if (storedValue === undefined) {
    return createEmptyLibrary();
  }
  assertSupportedVersion(storedValue);
  const parsed = pinLibrarySchema.safeParse(storedValue);
  if (!parsed.success) {
    throw new UnreadableLibraryError(
      `The saved pin library is damaged: ${z.prettifyError(parsed.error)}`,
      { cause: parsed.error },
    );
  }
  return parsed.data;
}

export function assertSupportedVersion(value: unknown): void {
  const versioned = versionedSchema.safeParse(value);
  if (!versioned.success) {
    throw new UnreadableLibraryError('The data has no valid schema version.', { cause: versioned.error });
  }
  if (versioned.data.schemaVersion > CURRENT_SCHEMA_VERSION) {
    throw new UnreadableLibraryError(
      `The data uses schema version ${versioned.data.schemaVersion}, but this extension only reads up to version ${CURRENT_SCHEMA_VERSION}. Update the extension.`,
    );
  }
}
