import { z } from 'zod';
import type { EntityFactory } from './entityFactory';
import {
  CURRENT_SCHEMA_VERSION,
  pinSetSchema,
  savedPinSchema,
  type PinLibrary,
  type PinSet,
  type SavedPin,
  type SavedPinId,
} from './librarySchema';
import { findPinByPinString, resolveSetPins } from './libraryOperations';
import { migrateToCurrentVersion, UnreadableLibraryError } from './storedLibrary';

export const EXPORT_FORMAT = 'opposite-pin-library';

const libraryExportSchema = z.object({
  format: z.literal(EXPORT_FORMAT),
  schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
  exportedAt: z.iso.datetime(),
  pins: z.array(savedPinSchema),
  sets: z.array(pinSetSchema),
});

export type LibraryExport = z.infer<typeof libraryExportSchema>;

export interface ImportSummary {
  readonly addedPins: number;
  readonly reusedPins: number;
  readonly addedSets: number;
  readonly skippedSets: number;
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

interface PinMergeResult {
  readonly pins: readonly SavedPin[];
  readonly importedToLibraryPinIds: ReadonlyMap<SavedPinId, SavedPinId>;
  readonly addedPins: number;
}

interface SetMergeResult {
  readonly sets: readonly PinSet[];
  readonly addedSets: number;
}

export function exportLibrary(library: PinLibrary, exportedAt: string): LibraryExport {
  return createExport(library.pins, library.sets, exportedAt);
}

export function exportSet(library: PinLibrary, set: PinSet, exportedAt: string): LibraryExport {
  return createExport(resolveSetPins(library, set), [set], exportedAt);
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
  const pinMerge = mergeImportedPins(library, imported.pins, factory);
  const setMerge = mergeImportedSets(library.sets, imported.sets, pinMerge.importedToLibraryPinIds, factory);
  return {
    library: { ...library, pins: [...pinMerge.pins], sets: [...setMerge.sets] },
    summary: {
      addedPins: pinMerge.addedPins,
      reusedPins: imported.pins.length - pinMerge.addedPins,
      addedSets: setMerge.addedSets,
      skippedSets: imported.sets.length - setMerge.addedSets,
    },
  };
}

function createExport(
  pins: readonly SavedPin[],
  sets: readonly PinSet[],
  exportedAt: string,
): LibraryExport {
  return {
    format: EXPORT_FORMAT,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt,
    pins: [...pins],
    sets: [...sets],
  };
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

function mergeImportedPins(
  library: PinLibrary,
  importedPins: readonly SavedPin[],
  factory: EntityFactory,
): PinMergeResult {
  const pins = [...library.pins];
  const importedToLibraryPinIds = new Map<SavedPinId, SavedPinId>();
  for (const importedPin of importedPins) {
    const existingPin = findPinByPinString(pins, importedPin.pinString);
    const libraryPin = existingPin ?? { ...importedPin, id: factory.newPinId() };
    if (existingPin === undefined) {
      pins.push(libraryPin);
    }
    importedToLibraryPinIds.set(importedPin.id, libraryPin.id);
  }
  return { pins, importedToLibraryPinIds, addedPins: pins.length - library.pins.length };
}

function mergeImportedSets(
  existingSets: readonly PinSet[],
  importedSets: readonly PinSet[],
  importedToLibraryPinIds: ReadonlyMap<SavedPinId, SavedPinId>,
  factory: EntityFactory,
): SetMergeResult {
  const sets = [...existingSets];
  for (const importedSet of importedSets) {
    const pinIds = importedSet.pinIds
      .map((id) => importedToLibraryPinIds.get(id))
      .filter((id) => id !== undefined);
    const isAlreadySaved = sets.some(
      (set) => set.name === importedSet.name && haveSamePinIds(set.pinIds, pinIds),
    );
    if (!isAlreadySaved) {
      sets.push({ ...importedSet, id: factory.newSetId(), pinIds });
    }
  }
  return { sets, addedSets: sets.length - existingSets.length };
}

function haveSamePinIds(first: readonly SavedPinId[], second: readonly SavedPinId[]): boolean {
  return first.length === second.length && first.every((id, index) => id === second[index]);
}
