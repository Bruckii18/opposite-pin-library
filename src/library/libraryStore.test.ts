import { describe, expect, it, vi } from 'vitest';
import { createSequentialFactory, pinDraft } from '../test/libraryFixtures';
import { CAST_FILTER, DEATH_BADGE } from '../test/pinFixtures';
import { addPin } from './libraryOperations';
import type { LibraryRepository } from './libraryRepository';
import { createEmptyLibrary, type PinLibrary } from './librarySchema';
import { LibraryNotReadyError, LibraryStatus, LibraryStore } from './libraryStore';
import { readStoredLibrary, UnreadableLibraryError } from './storedLibrary';

function inMemoryRepository(initialLibrary: PinLibrary = createEmptyLibrary()) {
  let storedLibrary = initialLibrary;
  const repository: LibraryRepository = {
    load: async () => storedLibrary,
    save: vi.fn(async (library: PinLibrary) => {
      storedLibrary = library;
    }),
    subscribe: () => () => undefined,
  };
  return { repository, readStored: () => storedLibrary };
}

async function startedStore(repository: LibraryRepository): Promise<LibraryStore> {
  const store = new LibraryStore(repository);
  store.start();
  await vi.waitFor(() => expect(store.getSnapshot().status).toBe(LibraryStatus.Ready));
  return store;
}

describe('LibraryStore', () => {
  it('applies concurrent changes one after another without losing any', async () => {
    const { repository, readStored } = inMemoryRepository();
    const store = await startedStore(repository);
    const factory = createSequentialFactory();

    await Promise.all([
      store.update((library) => addPin(library, pinDraft('Deaths', DEATH_BADGE), factory)),
      store.update((library) => addPin(library, pinDraft('Casts', CAST_FILTER), factory)),
    ]);

    expect(readStored().pins.map((pin) => pin.name)).toEqual(['Deaths', 'Casts']);
  });

  it('keeps working after a failed save and reports the failure to the caller', async () => {
    const { repository } = inMemoryRepository();
    vi.mocked(repository.save).mockRejectedValueOnce(new Error('quota exceeded'));
    const store = await startedStore(repository);
    const factory = createSequentialFactory();

    await expect(store.update((library) => addPin(library, pinDraft('Deaths', DEATH_BADGE), factory))).rejects.toThrow(
      'quota exceeded',
    );
    await store.update((library) => addPin(library, pinDraft('Casts', CAST_FILTER), factory));

    const state = store.getSnapshot();
    expect(state.status === LibraryStatus.Ready && state.library.pins.map((pin) => pin.name)).toEqual(['Casts']);
  });

  it('refuses changes while the stored library could not be read', async () => {
    const repository: LibraryRepository = {
      load: async () => readStoredLibrary({ schemaVersion: 99 }),
      save: vi.fn(),
      subscribe: () => () => undefined,
    };
    const store = new LibraryStore(repository);
    store.start();
    await vi.waitFor(() => expect(store.getSnapshot().status).toBe(LibraryStatus.Failed));

    await expect(store.update((library) => library)).rejects.toBeInstanceOf(LibraryNotReadyError);
    expect(repository.save).not.toHaveBeenCalled();
  });
});

describe('readStoredLibrary', () => {
  it('starts with an empty library when nothing is stored yet', () => {
    expect(readStoredLibrary(undefined)).toEqual(createEmptyLibrary());
  });

  it('rejects damaged data instead of silently replacing it', () => {
    expect(() => readStoredLibrary({ schemaVersion: 1, pins: 'oops', sets: [] })).toThrow(UnreadableLibraryError);
  });
});
