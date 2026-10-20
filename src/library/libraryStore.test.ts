import { describe, expect, it, vi } from 'vitest';
import { createSequentialFactory, entryDraft, FIXED_TIMESTAMP } from '../test/libraryFixtures';
import { CAST_FILTER, DEATH_BADGE } from '../test/pinFixtures';
import { addEntry } from './libraryOperations';
import type { LibraryRepository } from './libraryRepository';
import { createEmptyLibrary, CURRENT_SCHEMA_VERSION, type PinLibrary } from './librarySchema';
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
      store.update((library) => addEntry(library, entryDraft('Deaths', [DEATH_BADGE]), factory)),
      store.update((library) => addEntry(library, entryDraft('Casts', [CAST_FILTER]), factory)),
    ]);

    expect(readStored().entries.map((entry) => entry.name)).toEqual(['Deaths', 'Casts']);
  });

  it('keeps working after a failed save and reports the failure to the caller', async () => {
    const { repository } = inMemoryRepository();
    vi.mocked(repository.save).mockRejectedValueOnce(new Error('quota exceeded'));
    const store = await startedStore(repository);
    const factory = createSequentialFactory();

    await expect(store.update((library) => addEntry(library, entryDraft('Deaths', [DEATH_BADGE]), factory))).rejects.toThrow(
      'quota exceeded',
    );
    await store.update((library) => addEntry(library, entryDraft('Casts', [CAST_FILTER]), factory));

    const state = store.getSnapshot();
    expect(state.status === LibraryStatus.Ready && state.library.entries.map((entry) => entry.name)).toEqual(['Casts']);
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

  it('migrates a version 1 library to the current version without adding saved views', () => {
    const storedPin = {
      id: 'pin-1',
      name: 'Deaths',
      description: 'Who died first',
      tags: ['raid'],
      pinString: DEATH_BADGE,
      createdAt: FIXED_TIMESTAMP,
      updatedAt: FIXED_TIMESTAMP,
    };
    const storedSet = {
      id: 'set-1',
      name: 'Raid',
      description: '',
      tags: [],
      pinIds: ['pin-1'],
      createdAt: FIXED_TIMESTAMP,
      updatedAt: FIXED_TIMESTAMP,
    };

    const library = readStoredLibrary({ schemaVersion: 1, pins: [storedPin], sets: [storedSet] });

    expect(library).toStrictEqual({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      entries: [
        { id: 'pin-1', name: 'Deaths', description: 'Who died first', tags: ['raid'], pins: [DEATH_BADGE], createdAt: FIXED_TIMESTAMP, updatedAt: FIXED_TIMESTAMP },
        { id: 'set-1', name: 'Raid', description: '', tags: [], pins: [DEATH_BADGE], createdAt: FIXED_TIMESTAMP, updatedAt: FIXED_TIMESTAMP },
      ],
    });
  });

  it('reads saved views and drops report-specific params and missing values', () => {
    const library = addEntry(
      createEmptyLibrary(),
      { ...entryDraft('Deaths', [DEATH_BADGE]), viewParams: { tab: 'deaths' } },
      createSequentialFactory(),
    );
    const storedEntry = {
      ...library.entries[0],
      viewParams: { tab: 'deaths', fight: '4', difficulty: '5', ability: 'null', hostility: null },
    };

    const readLibrary = readStoredLibrary({ ...library, entries: [storedEntry] });

    expect(readLibrary.entries[0]?.viewParams).toStrictEqual({ tab: 'deaths' });
  });

  it('migrates version 2 views from raw type values to tabs', () => {
    const storedPin = (id: string, viewParams: Record<string, string>) => ({
      id,
      name: id,
      description: '',
      tags: [],
      pinString: DEATH_BADGE,
      viewParams,
      createdAt: FIXED_TIMESTAMP,
      updatedAt: FIXED_TIMESTAMP,
    });
    const storedSet = {
      id: 'set-1',
      name: 'Raid',
      description: '',
      tags: [],
      pinIds: ['auras'],
      viewParams: { type: 'debuffs', ability: '1282419' },
      createdAt: FIXED_TIMESTAMP,
      updatedAt: FIXED_TIMESTAMP,
    };

    const library = readStoredLibrary({
      schemaVersion: 2,
      pins: [
        storedPin('auras', { type: 'auras', ability: '1282419' }),
        storedPin('debuffs', { type: 'debuffs' }),
        storedPin('buffs', { type: 'buffs', view: 'events' }),
        storedPin('unknown', { type: 'not-a-tab', ability: '1304424', view: 'timeline' }),
        storedPin('junk', { type: 'damage-taken', ability: 'null', view: 'undefined' }),
      ],
      sets: [storedSet],
    });

    expect(library.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(library.entries.map((entry) => entry.viewParams)).toStrictEqual([
      { tab: 'buffs', ability: '1282419' },
      { tab: 'debuffs' },
      { tab: 'buffs', view: 'events' },
      { ability: '1304424', view: 'timeline' },
      { tab: 'damage-taken' },
      { tab: 'debuffs', ability: '1282419' },
    ]);
  });

  it('rejects data from a newer schema version', () => {
    expect(() => readStoredLibrary({ schemaVersion: CURRENT_SCHEMA_VERSION + 1, entries: [] })).toThrow(
      'Update the extension',
    );
  });

  it('keeps named pins as their own entries and folds generated set pins into their set', () => {
    const storedPin = (id: string, name: string, pinString: string, extra: Record<string, unknown> = {}) => ({
      id,
      name,
      description: '',
      tags: [],
      pinString,
      createdAt: FIXED_TIMESTAMP,
      updatedAt: FIXED_TIMESTAMP,
      ...extra,
    });
    const storedSet = {
      id: 'set-1',
      name: 'Coiled Altar',
      description: '',
      tags: [],
      pinIds: ['generated', 'renamed', 'tagged', 'deleted-pin'],
      createdAt: FIXED_TIMESTAMP,
      updatedAt: FIXED_TIMESTAMP,
    };

    const library = readStoredLibrary({
      schemaVersion: 3,
      pins: [
        storedPin('generated', 'Filter: type = "cast"', CAST_FILTER),
        storedPin('renamed', 'DMG AMP onward', DEATH_BADGE),
        storedPin('tagged', 'Badge: type = "death"', DEATH_BADGE, { tags: ['raid'] }),
        storedPin('standalone', 'Filter: type = "cast"', CAST_FILTER),
      ],
      sets: [storedSet],
    });

    expect(library.entries.map((entry) => [entry.name, entry.pins])).toEqual([
      ['DMG AMP onward', [DEATH_BADGE]],
      ['Badge: type = "death"', [DEATH_BADGE]],
      ['Filter: type = "cast"', [CAST_FILTER]],
      ['Coiled Altar', [CAST_FILTER, DEATH_BADGE]],
    ]);
  });

  it('rejects damaged version 4 data instead of reading it as an empty library', () => {
    expect(() => readStoredLibrary({ schemaVersion: 4, pins: 'oops', sets: [] })).toThrow(UnreadableLibraryError);
  });
});
