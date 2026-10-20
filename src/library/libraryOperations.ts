import type { PinString } from '../wcl/pinString';
import type { ViewParams } from '../wcl/viewParams';
import type { EntityFactory } from './entityFactory';
import type { LibraryEntry, LibraryEntryId, PinLibrary } from './librarySchema';
import { nameForCopy } from './pinNaming';

export interface EntryDraft {
  readonly name: string;
  readonly description: string;
  readonly tags: readonly string[];
  readonly pins: readonly PinString[];
  readonly viewParams?: ViewParams | undefined;
}

export function addEntry(library: PinLibrary, draft: EntryDraft, factory: EntityFactory): PinLibrary {
  const timestamp = factory.timestamp();
  const entry = { id: factory.newEntryId(), ...copyEntryDraft(draft), createdAt: timestamp, updatedAt: timestamp };
  return { ...library, entries: [...library.entries, entry] };
}

export function updateEntry(
  library: PinLibrary,
  entryId: LibraryEntryId,
  draft: EntryDraft,
  factory: EntityFactory,
): PinLibrary {
  return {
    ...library,
    entries: library.entries.map((entry) =>
      entry.id === entryId ? { ...entry, ...copyEntryDraft(draft), updatedAt: factory.timestamp() } : entry,
    ),
  };
}

export function deleteEntry(library: PinLibrary, entryId: LibraryEntryId): PinLibrary {
  return { ...library, entries: library.entries.filter((entry) => entry.id !== entryId) };
}

export function duplicateEntry(
  library: PinLibrary,
  entryId: LibraryEntryId,
  factory: EntityFactory,
): PinLibrary {
  const original = library.entries.find((entry) => entry.id === entryId);
  return original === undefined
    ? library
    : addEntry(library, { ...original, name: nameForCopy(original.name) }, factory);
}

export function findSinglePinEntry(
  entries: readonly LibraryEntry[],
  pin: PinString,
): LibraryEntry | undefined {
  return entries.find((entry) => isSinglePinEntry(entry) && entry.pins[0] === pin);
}

export function findGroupsContainingPin(
  entries: readonly LibraryEntry[],
  pin: PinString,
): LibraryEntry[] {
  return entries.filter((entry) => !isSinglePinEntry(entry) && entry.pins.includes(pin));
}

export function namePinsBySinglePinEntries(
  entries: readonly LibraryEntry[],
): ReadonlyMap<PinString, string> {
  const namesByPin = new Map<PinString, string>();
  for (const entry of entries.filter(isSinglePinEntry)) {
    const [pin] = entry.pins;
    if (pin !== undefined && !namesByPin.has(pin)) {
      namesByPin.set(pin, entry.name);
    }
  }
  return namesByPin;
}

export function isSinglePinEntry(entry: LibraryEntry): boolean {
  return entry.pins.length === 1;
}

function copyEntryDraft({ name, description, tags, pins, viewParams }: EntryDraft) {
  return { name, description, tags: [...tags], pins: [...new Set(pins)], viewParams };
}
