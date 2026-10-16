import type { PinString } from '../wcl/pinString';
import type { EntityFactory } from './entityFactory';
import type { PinLibrary, PinSet, PinSetId, SavedPin, SavedPinId } from './librarySchema';
import { nameForCopy, suggestPinName } from './pinNaming';

export interface PinDraft {
  readonly name: string;
  readonly description: string;
  readonly tags: readonly string[];
  readonly pinString: PinString;
}

export interface PinSetDetails {
  readonly name: string;
  readonly description: string;
  readonly tags: readonly string[];
}

export interface PinSetDraft extends PinSetDetails {
  readonly pinIds: readonly SavedPinId[];
}

export function addPin(library: PinLibrary, draft: PinDraft, factory: EntityFactory): PinLibrary {
  return { ...library, pins: [...library.pins, createPin(draft, factory)] };
}

export function updatePin(
  library: PinLibrary,
  pinId: SavedPinId,
  draft: PinDraft,
  factory: EntityFactory,
): PinLibrary {
  return {
    ...library,
    pins: library.pins.map((pin) =>
      pin.id === pinId ? { ...pin, ...copyPinDraft(draft), updatedAt: factory.timestamp() } : pin,
    ),
  };
}

export function deletePin(library: PinLibrary, pinId: SavedPinId): PinLibrary {
  return {
    ...library,
    pins: library.pins.filter((pin) => pin.id !== pinId),
    sets: library.sets.map((set) => ({ ...set, pinIds: set.pinIds.filter((id) => id !== pinId) })),
  };
}

export function duplicatePin(
  library: PinLibrary,
  pinId: SavedPinId,
  factory: EntityFactory,
): PinLibrary {
  const original = library.pins.find((pin) => pin.id === pinId);
  return original === undefined
    ? library
    : addPin(library, { ...original, name: nameForCopy(original.name) }, factory);
}

export function addSet(library: PinLibrary, draft: PinSetDraft, factory: EntityFactory): PinLibrary {
  return { ...library, sets: [...library.sets, createSet(draft, factory)] };
}

export function updateSet(
  library: PinLibrary,
  setId: PinSetId,
  draft: PinSetDraft,
  factory: EntityFactory,
): PinLibrary {
  return {
    ...library,
    sets: library.sets.map((set) =>
      set.id === setId ? { ...set, ...copySetDraft(draft), updatedAt: factory.timestamp() } : set,
    ),
  };
}

export function deleteSet(library: PinLibrary, setId: PinSetId): PinLibrary {
  return { ...library, sets: library.sets.filter((set) => set.id !== setId) };
}

export function duplicateSet(
  library: PinLibrary,
  setId: PinSetId,
  factory: EntityFactory,
): PinLibrary {
  const original = library.sets.find((set) => set.id === setId);
  return original === undefined
    ? library
    : addSet(library, { ...original, name: nameForCopy(original.name) }, factory);
}

export function addPinsAsSet(
  library: PinLibrary,
  pinStrings: readonly PinString[],
  details: PinSetDetails,
  factory: EntityFactory,
): PinLibrary {
  const libraryWithPins = pinStrings.reduce(
    (current, pinString) => addPinUnlessSaved(current, pinString, factory),
    library,
  );
  const pinIds = pinStrings
    .map((pinString) => findPinByPinString(libraryWithPins.pins, pinString)?.id)
    .filter((id) => id !== undefined);
  return addSet(libraryWithPins, { ...details, pinIds }, factory);
}

export function findPinByPinString(
  pins: readonly SavedPin[],
  pinString: PinString,
): SavedPin | undefined {
  return pins.find((pin) => pin.pinString === pinString);
}

export function resolveSetPins(library: PinLibrary, set: PinSet): SavedPin[] {
  const pinsById = new Map(library.pins.map((pin) => [pin.id, pin]));
  return set.pinIds.map((id) => pinsById.get(id)).filter((pin) => pin !== undefined);
}

function addPinUnlessSaved(
  library: PinLibrary,
  pinString: PinString,
  factory: EntityFactory,
): PinLibrary {
  return findPinByPinString(library.pins, pinString) === undefined
    ? addPin(library, { name: suggestPinName(pinString), description: '', tags: [], pinString }, factory)
    : library;
}

function createPin(draft: PinDraft, factory: EntityFactory): SavedPin {
  const timestamp = factory.timestamp();
  return { id: factory.newPinId(), ...copyPinDraft(draft), createdAt: timestamp, updatedAt: timestamp };
}

function createSet(draft: PinSetDraft, factory: EntityFactory): PinSet {
  const timestamp = factory.timestamp();
  return { id: factory.newSetId(), ...copySetDraft(draft), createdAt: timestamp, updatedAt: timestamp };
}

function copyPinDraft({ name, description, tags, pinString }: PinDraft) {
  return { name, description, tags: [...tags], pinString };
}

function copySetDraft({ name, description, tags, pinIds }: PinSetDraft) {
  return { name, description, tags: [...tags], pinIds: [...pinIds] };
}
