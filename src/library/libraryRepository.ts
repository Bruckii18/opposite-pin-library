import type { PinLibrary } from './librarySchema';
import { readStoredLibrary } from './storedLibrary';

export interface LibraryRepository {
  load(): Promise<PinLibrary>;
  save(library: PinLibrary): Promise<void>;
  subscribe(onChange: (library: PinLibrary) => void, onError: (error: unknown) => void): () => void;
}

const LIBRARY_STORAGE_KEY = 'pinLibrary';

export function createChromeStorageLibraryRepository(
  storageArea: chrome.storage.StorageArea,
): LibraryRepository {
  return {
    async load() {
      const stored = await storageArea.get(LIBRARY_STORAGE_KEY);
      return readStoredLibrary(stored[LIBRARY_STORAGE_KEY]);
    },

    async save(library) {
      await storageArea.set({ [LIBRARY_STORAGE_KEY]: library });
    },

    subscribe(onChange, onError) {
      const handleChanges = (changes: Record<string, chrome.storage.StorageChange>): void => {
        const libraryChange = changes[LIBRARY_STORAGE_KEY];
        if (libraryChange === undefined) {
          return;
        }
        try {
          onChange(readStoredLibrary(libraryChange.newValue));
        } catch (error) {
          onError(error);
        }
      };
      storageArea.onChanged.addListener(handleChanges);
      return () => storageArea.onChanged.removeListener(handleChanges);
    },
  };
}
