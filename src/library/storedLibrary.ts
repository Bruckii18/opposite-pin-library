import { z } from 'zod';
import { isRecord } from '../shared/records';
import { validatePinString } from '../wcl/pinString';
import { viewParamsFromQuery } from '../wcl/viewParams';
import { CURRENT_SCHEMA_VERSION, createEmptyLibrary, pinLibrarySchema, type PinLibrary } from './librarySchema';
import { suggestPinName } from './pinNaming';

export class UnreadableLibraryError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'UnreadableLibraryError';
  }
}

const versionedSchema = z.looseObject({ schemaVersion: z.number().int() });

type VersionedData = z.infer<typeof versionedSchema>;
type Migration = (data: VersionedData) => VersionedData;

const LegacyPinScope = {
  Library: 'library',
  Sets: 'sets',
} as const;

const LEGACY_PIN_ONLY_KEYS: ReadonlySet<string> = new Set(['pinString', 'scope']);

const addOptionalViewParams: Migration = (data) => ({ ...data, schemaVersion: 2 });

const storeViewsAsTabs: Migration = (data) => ({
  ...data,
  schemaVersion: 3,
  pins: migrateSavedViews(data.pins),
  sets: migrateSavedViews(data.sets),
});

const separateSetOnlyPins: Migration = (data) => {
  const setPinIds = collectSetPinIds(data.sets);
  return {
    ...data,
    schemaVersion: 4,
    pins: Array.isArray(data.pins) ? data.pins.map((pin) => withPinScope(pin, setPinIds)) : data.pins,
  };
};

const mergePinsAndSetsIntoEntries: Migration = (data) => {
  const { pins, sets, ...unchangedData } = data;
  if (!Array.isArray(pins) || !Array.isArray(sets)) {
    return { ...unchangedData, schemaVersion: 5 };
  }
  const pinStringsById = new Map(pins.filter(isRecord).map((pin) => [pin.id, pin.pinString]));
  const entries = [
    ...pins.filter((pin) => !isRecord(pin) || pin.scope !== LegacyPinScope.Sets).map(entryFromPin),
    ...sets.map((set) => entryFromSet(set, pinStringsById)),
  ].sort(byCreationTime);
  return { ...unchangedData, schemaVersion: 5, entries };
};

const MIGRATIONS_BY_SOURCE_VERSION: ReadonlyMap<number, Migration> = new Map([
  [1, addOptionalViewParams],
  [2, storeViewsAsTabs],
  [3, separateSetOnlyPins],
  [4, mergePinsAndSetsIntoEntries],
]);

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

function migrateSavedViews(entities: unknown): unknown {
  return Array.isArray(entities) ? entities.map(migrateSavedView) : entities;
}

function migrateSavedView(entity: unknown): unknown {
  return isRecord(entity) && isRecord(entity.viewParams)
    ? { ...entity, viewParams: viewParamsFromQuery(entity.viewParams) }
    : entity;
}

function collectSetPinIds(sets: unknown): ReadonlySet<unknown> {
  const pinIds = Array.isArray(sets)
    ? sets.flatMap((set: unknown) => (isRecord(set) && Array.isArray(set.pinIds) ? set.pinIds : []))
    : [];
  return new Set(pinIds);
}

// Before version 4, "Save all as set" added every new pin to the pin library under its generated
// name. Those untouched generated pins that a set uses become set-only pins.
function withPinScope(pin: unknown, setPinIds: ReadonlySet<unknown>): unknown {
  if (!isRecord(pin)) {
    return pin;
  }
  const isSetOnly = setPinIds.has(pin.id) && isUntouchedGeneratedPin(pin);
  return { ...pin, scope: isSetOnly ? LegacyPinScope.Sets : LegacyPinScope.Library };
}

function isUntouchedGeneratedPin(pin: Record<string, unknown>): boolean {
  const validation = typeof pin.pinString === 'string' ? validatePinString(pin.pinString) : null;
  return (
    validation?.valid === true &&
    pin.name === suggestPinName(validation.pinString) &&
    pin.description === '' &&
    Array.isArray(pin.tags) &&
    pin.tags.length === 0 &&
    pin.viewParams === undefined
  );
}

function entryFromPin(pin: unknown): unknown {
  if (!isRecord(pin)) {
    return pin;
  }
  const entryFields = Object.entries(pin).filter(([key]) => !LEGACY_PIN_ONLY_KEYS.has(key));
  return { ...Object.fromEntries(entryFields), pins: [pin.pinString] };
}

function entryFromSet(set: unknown, pinStringsById: ReadonlyMap<unknown, unknown>): unknown {
  if (!isRecord(set)) {
    return set;
  }
  const { pinIds, ...entryFields } = set;
  const pins = Array.isArray(pinIds)
    ? [...new Set(pinIds.map((id) => pinStringsById.get(id)).filter((pin) => pin !== undefined))]
    : pinIds;
  return { ...entryFields, pins };
}

function byCreationTime(first: unknown, second: unknown): number {
  return creationTimeOf(first).localeCompare(creationTimeOf(second));
}

function creationTimeOf(entry: unknown): string {
  return isRecord(entry) && typeof entry.createdAt === 'string' ? entry.createdAt : '';
}
