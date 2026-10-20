import { z } from 'zod';
import type { EntityFactory } from './entityFactory';
import {
  CURRENT_SCHEMA_VERSION,
  libraryEntrySchema,
  type LibraryEntry,
  type PinLibrary,
} from './librarySchema';
import { migrateToCurrentVersion, UnreadableLibraryError } from './storedLibrary';

export const EXPORT_FORMAT = 'opposite-pin-library';

const libraryExportSchema = z.object({
  format: z.literal(EXPORT_FORMAT),
  schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
  exportedAt: z.iso.datetime(),
  entries: z.array(libraryEntrySchema),
});

export type LibraryExport = z.infer<typeof libraryExportSchema>;

export interface ImportSummary {
  readonly addedEntries: number;
  readonly skippedEntries: number;
}

export interface ImportResult {
  readonly library: PinLibrary;
  readonly summary: ImportSummary;
}

export class ImportFileError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ImportFileError';
  }
}

export function exportLibrary(library: PinLibrary, exportedAt: string): LibraryExport {
  return createExport(library.entries, exportedAt);
}

export function exportEntry(entry: LibraryEntry, exportedAt: string): LibraryExport {
  return createExport([entry], exportedAt);
}

export function parseLibraryExport(fileContent: string): LibraryExport {
  const json = parseJson(fileContent);
  if (typeof json !== 'object' || json === null || Reflect.get(json, 'format') !== EXPORT_FORMAT) {
    throw new ImportFileError('This is not an Opposite Pin Library export file.');
  }
  const parsed = libraryExportSchema.safeParse(migrateExport(json));
  if (!parsed.success) {
    throw new ImportFileError(`The export file is invalid: ${z.prettifyError(parsed.error)}`, {
      cause: parsed.error,
    });
  }
  return parsed.data;
}

export function mergeImport(
  library: PinLibrary,
  imported: LibraryExport,
  factory: EntityFactory,
): ImportResult {
  const entries = [...library.entries];
  for (const importedEntry of imported.entries) {
    if (!entries.some((entry) => isSameEntry(entry, importedEntry))) {
      entries.push({ ...importedEntry, id: factory.newEntryId() });
    }
  }
  const addedEntries = entries.length - library.entries.length;
  return {
    library: { ...library, entries },
    summary: { addedEntries, skippedEntries: imported.entries.length - addedEntries },
  };
}

function createExport(entries: readonly LibraryEntry[], exportedAt: string): LibraryExport {
  return { format: EXPORT_FORMAT, schemaVersion: CURRENT_SCHEMA_VERSION, exportedAt, entries: [...entries] };
}

function isSameEntry(first: LibraryEntry, second: LibraryEntry): boolean {
  return (
    first.name === second.name &&
    first.pins.length === second.pins.length &&
    first.pins.every((pin) => second.pins.includes(pin))
  );
}

function migrateExport(json: unknown): unknown {
  try {
    return migrateToCurrentVersion(json);
  } catch (error) {
    throw new ImportFileError(
      error instanceof UnreadableLibraryError ? error.message : 'Unsupported export file version.',
      { cause: error },
    );
  }
}

function parseJson(fileContent: string): unknown {
  try {
    return JSON.parse(fileContent);
  } catch (error) {
    throw new ImportFileError('The file is not valid JSON.', { cause: error });
  }
}
