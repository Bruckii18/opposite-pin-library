import { describe, expect, it } from 'vitest';
import { createSequentialFactory, entryDraft, FIXED_TIMESTAMP, requireDefined } from '../test/libraryFixtures';
import { CAST_FILTER, DEATH_BADGE, MOONFIRE_DECORATOR } from '../test/pinFixtures';
import { addEntry, type EntryDraft } from './libraryOperations';
import { createEmptyLibrary, CURRENT_SCHEMA_VERSION, type PinLibrary } from './librarySchema';
import {
  EXPORT_FORMAT,
  exportEntry,
  exportLibrary,
  ImportFileError,
  mergeImport,
  parseLibraryExport,
} from './libraryTransfer';

function sharedLibrary(): PinLibrary {
  const factory = createSequentialFactory();
  const drafts: EntryDraft[] = [
    { ...entryDraft('Moonfire', [MOONFIRE_DECORATOR]), viewParams: { tab: 'casts' } },
    { ...entryDraft('Raid', [DEATH_BADGE, CAST_FILTER], ['raid']), viewParams: { tab: 'debuffs', hostility: '1' } },
  ];
  return drafts.reduce((library, draft) => addEntry(library, draft, factory), createEmptyLibrary());
}

const storedRecord = (fields: Record<string, unknown>) => ({
  description: '',
  tags: [],
  createdAt: FIXED_TIMESTAMP,
  updatedAt: FIXED_TIMESTAMP,
  ...fields,
});

describe('export', () => {
  it('exports the whole library with format and schema version', () => {
    const exported = exportLibrary(sharedLibrary(), FIXED_TIMESTAMP);

    expect(exported).toMatchObject({ format: EXPORT_FORMAT, schemaVersion: 5, exportedAt: FIXED_TIMESTAMP });
    expect(exported.entries.map((entry) => entry.name)).toEqual(['Moonfire', 'Raid']);
  });

  it('exports a single entry with all of its pins', () => {
    const entry = requireDefined(sharedLibrary().entries[1]);

    expect(exportEntry(entry, FIXED_TIMESTAMP).entries).toEqual([entry]);
  });
});

describe('import', () => {
  it('round-trips an export into an empty library, including views and tags', () => {
    const exported = JSON.stringify(exportLibrary(sharedLibrary(), FIXED_TIMESTAMP));

    const { library, summary } = mergeImport(createEmptyLibrary(), parseLibraryExport(exported), createSequentialFactory());

    expect(summary).toEqual({ addedEntries: 2, skippedEntries: 0 });
    expect(library.entries[1]).toMatchObject({
      name: 'Raid',
      pins: [DEATH_BADGE, CAST_FILTER],
      tags: ['raid'],
      viewParams: { tab: 'debuffs', hostility: '1' },
    });
  });

  it('skips entries with the same name and the same pins, in any order', () => {
    const library = sharedLibrary();
    const [moonfire, raid] = library.entries;
    const exported = {
      ...exportLibrary(library, FIXED_TIMESTAMP),
      entries: [
        { ...requireDefined(raid), pins: [CAST_FILTER, DEATH_BADGE] },
        { ...requireDefined(moonfire), name: 'Moonfire (other guild)' },
      ],
    };

    const { library: merged, summary } = mergeImport(
      library,
      parseLibraryExport(JSON.stringify(exported)),
      createSequentialFactory(),
    );

    expect(summary).toEqual({ addedEntries: 1, skippedEntries: 1 });
    expect(merged.entries.map((entry) => entry.name)).toEqual(['Moonfire', 'Raid', 'Moonfire (other guild)']);
  });

  it('drops report-specific params and missing values from imported views', () => {
    const fileContent = JSON.stringify({
      ...exportLibrary(createEmptyLibrary(), FIXED_TIMESTAMP),
      entries: [
        storedRecord({
          id: 'entry',
          name: 'Deaths',
          pins: [DEATH_BADGE],
          viewParams: { tab: 'deaths', fight: '3', boss: '3513', source: '12', view: '', ability: 'undefined' },
        }),
      ],
    });

    expect(parseLibraryExport(fileContent).entries[0]?.viewParams).toStrictEqual({ tab: 'deaths' });
  });

  it('imports version 1 export files as entries', () => {
    const fileContent = JSON.stringify({
      format: EXPORT_FORMAT,
      schemaVersion: 1,
      exportedAt: FIXED_TIMESTAMP,
      pins: [storedRecord({ id: 'old-pin', name: 'Deaths', tags: ['raid'], pinString: DEATH_BADGE })],
      sets: [storedRecord({ id: 'old-set', name: 'Raid', pinIds: ['old-pin'] })],
    });

    const imported = parseLibraryExport(fileContent);

    expect(imported.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(imported.entries.map((entry) => [entry.name, entry.pins, entry.tags])).toEqual([
      ['Deaths', [DEATH_BADGE], ['raid']],
      ['Raid', [DEATH_BADGE], []],
    ]);
  });

  it('migrates views in version 2 export files from raw type values to tabs', () => {
    const fileContent = JSON.stringify({
      format: EXPORT_FORMAT,
      schemaVersion: 2,
      exportedAt: FIXED_TIMESTAMP,
      pins: [
        storedRecord({ id: 'buffs', name: 'Buffs', pinString: DEATH_BADGE, viewParams: { type: 'auras' } }),
        storedRecord({ id: 'debuffs', name: 'Debuffs', pinString: CAST_FILTER, viewParams: { type: 'debuffs', ability: '1282419' } }),
      ],
      sets: [],
    });

    expect(parseLibraryExport(fileContent).entries.map((entry) => entry.viewParams)).toStrictEqual([
      { tab: 'buffs' },
      { tab: 'debuffs', ability: '1282419' },
    ]);
  });

  it('turns a version 4 set into one entry and keeps its set-only pins inside it', () => {
    const fileContent = JSON.stringify({
      format: EXPORT_FORMAT,
      schemaVersion: 4,
      exportedAt: FIXED_TIMESTAMP,
      pins: [
        storedRecord({ id: 'named', name: 'DMG AMP onward', pinString: DEATH_BADGE, scope: 'library' }),
        storedRecord({ id: 'generated', name: 'Filter: type = "cast"', pinString: CAST_FILTER, scope: 'sets' }),
      ],
      sets: [storedRecord({ id: 'set', name: 'Coiled Altar', pinIds: ['named', 'generated'] })],
    });

    const imported = parseLibraryExport(fileContent);

    expect(imported.entries.map((entry) => [entry.name, entry.pins])).toEqual([
      ['DMG AMP onward', [DEATH_BADGE]],
      ['Coiled Altar', [DEATH_BADGE, CAST_FILTER]],
    ]);
  });

  it.each([
    ['invalid JSON', '{nope', 'not valid JSON'],
    ['another JSON file', '{"hello":"world"}', 'not an Opposite Pin Library export'],
    [
      'a file from a newer version',
      JSON.stringify({ format: EXPORT_FORMAT, schemaVersion: CURRENT_SCHEMA_VERSION + 1, entries: [] }),
      `schema version ${CURRENT_SCHEMA_VERSION + 1}`,
    ],
    [
      'a file with a broken entry',
      JSON.stringify({ ...exportLibrary(createEmptyLibrary(), FIXED_TIMESTAMP), entries: [{ id: 'x' }] }),
      'The export file is invalid',
    ],
  ])('rejects %s with a readable message', (_description, fileContent, expectedMessage) => {
    expect(() => parseLibraryExport(fileContent)).toThrow(ImportFileError);
    expect(() => parseLibraryExport(fileContent)).toThrow(expectedMessage);
  });
});
