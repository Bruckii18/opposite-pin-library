import type { PinString } from '../wcl/pinString';
import type { EntityFactory } from './entityFactory';
import {
  addPin,
  addPinsAsSet,
  addSet,
  deletePin,
  deleteSet,
  duplicatePin,
  duplicateSet,
  updatePin,
  updateSet,
  type PinDraft,
  type PinSetDetails,
  type PinSetDraft,
} from './libraryOperations';
import type { PinSetId, SavedPinId } from './librarySchema';
import type { LibraryStore } from './libraryStore';
import { mergeImport, parseLibraryExport, type ImportSummary } from './libraryTransfer';

export interface LibraryActions {
  savePin(draft: PinDraft): Promise<void>;
  updatePin(pinId: SavedPinId, draft: PinDraft): Promise<void>;
  deletePin(pinId: SavedPinId): Promise<void>;
  duplicatePin(pinId: SavedPinId): Promise<void>;
  saveSet(draft: PinSetDraft): Promise<void>;
  updateSet(setId: PinSetId, draft: PinSetDraft): Promise<void>;
  deleteSet(setId: PinSetId): Promise<void>;
  duplicateSet(setId: PinSetId): Promise<void>;
  savePinsAsSet(pinStrings: readonly PinString[], details: PinSetDetails): Promise<void>;
  importFile(fileContent: string): Promise<ImportSummary>;
}

export function createLibraryActions(store: LibraryStore, factory: EntityFactory): LibraryActions {
  return {
    savePin: (draft) => store.update((library) => addPin(library, draft, factory)),
    updatePin: (pinId, draft) => store.update((library) => updatePin(library, pinId, draft, factory)),
    deletePin: (pinId) => store.update((library) => deletePin(library, pinId)),
    duplicatePin: (pinId) => store.update((library) => duplicatePin(library, pinId, factory)),
    saveSet: (draft) => store.update((library) => addSet(library, draft, factory)),
    updateSet: (setId, draft) => store.update((library) => updateSet(library, setId, draft, factory)),
    deleteSet: (setId) => store.update((library) => deleteSet(library, setId)),
    duplicateSet: (setId) => store.update((library) => duplicateSet(library, setId, factory)),
    savePinsAsSet: (pinStrings, details) =>
      store.update((library) => addPinsAsSet(library, pinStrings, details, factory)),
    importFile: async (fileContent) => {
      const imported = parseLibraryExport(fileContent);
      return store.change((library) => {
        const { library: mergedLibrary, summary } = mergeImport(library, imported, factory);
        return { library: mergedLibrary, outcome: summary };
      });
    },
  };
}
