import type { EntityFactory } from './entityFactory';
import {
  addEntry,
  deleteEntry,
  duplicateEntry,
  updateEntry,
  type EntryDraft,
} from './libraryOperations';
import type { LibraryEntryId } from './librarySchema';
import type { LibraryStore } from './libraryStore';
import { mergeImport, parseLibraryExport, type ImportSummary } from './libraryTransfer';

export interface LibraryActions {
  saveEntry(draft: EntryDraft): Promise<void>;
  updateEntry(entryId: LibraryEntryId, draft: EntryDraft): Promise<void>;
  deleteEntry(entryId: LibraryEntryId): Promise<void>;
  duplicateEntry(entryId: LibraryEntryId): Promise<void>;
  importFile(fileContent: string): Promise<ImportSummary>;
}

export function createLibraryActions(store: LibraryStore, factory: EntityFactory): LibraryActions {
  return {
    saveEntry: (draft) => store.update((library) => addEntry(library, draft, factory)),
    updateEntry: (entryId, draft) => store.update((library) => updateEntry(library, entryId, draft, factory)),
    deleteEntry: (entryId) => store.update((library) => deleteEntry(library, entryId)),
    duplicateEntry: (entryId) => store.update((library) => duplicateEntry(library, entryId, factory)),
    importFile: async (fileContent) => {
      const imported = parseLibraryExport(fileContent);
      return store.change((library) => {
        const { library: mergedLibrary, summary } = mergeImport(library, imported, factory);
        return { library: mergedLibrary, outcome: summary };
      });
    },
  };
}
