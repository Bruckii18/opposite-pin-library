import { describe, expect, it } from 'vitest';
import { createSequentialFactory, FIXED_TIMESTAMP, pinDraft, requireDefined } from '../test/libraryFixtures';
import { CAST_FILTER, DEATH_BADGE, MOONFIRE_DECORATOR } from '../test/pinFixtures';
import { addPin, addPinsAsSet } from './libraryOperations';
import { createEmptyLibrary, CURRENT_SCHEMA_VERSION, type PinLibrary } from './librarySchema';
import {
  EXPORT_FORMAT,
  exportLibrary,
  exportSet,
  ImportFileError,
  mergeImport,
  parseLibraryExport,
} from './libraryTransfer';

const VERSION_1_EXPORT = JSON.stringify({
  format: EXPORT_FORMAT,
  schemaVersion: 1,
  exportedAt: FIXED_TIMESTAMP,
  pins: [
    {
      id: 'old-pin',
      name: 'Deaths',
      description: '',
      tags: ['raid'],
      pinString: DEATH_BADGE,
      createdAt: FIXED_TIMESTAMP,
      updatedAt: FIXED_TIMESTAMP,
    },
  ],
  sets: [
    {
      id: 'old-set',
      name: 'Raid',
      description: '',
      tags: [],
      pinIds: ['old-pin'],
      createdAt: FIXED_TIMESTAMP,
      updatedAt: FIXED_TIMESTAMP,
    },
  ],
});

function sharedLibrary(): PinLibrary {
  const factory = createSequentialFactory();
  const withPin = addPin(createEmptyLibrary(), pinDraft('Moonfire', MOONFIRE_DECORATOR), factory);
  return addPinsAsSet(withPin, [DEATH_BADGE, CAST_FILTER], { name: 'Raid', description: '', tags: [] }, factory);
}

describe('export', () => {
  it('exports the whole library with format and schema version', () => {
    const exported = exportLibrary(sharedLibrary(), FIXED_TIMESTAMP);

    expect(exported).toMatchObject({ format: EXPORT_FORMAT, schemaVersion: 2, exportedAt: FIXED_TIMESTAMP });
    expect(exported.pins).toHaveLength(3);
    expect(exported.sets).toHaveLength(1);
  });

  it('exports a set together with only its own pins', () => {
    const library = sharedLibrary();

    const exported = exportSet(library, requireDefined(library.sets[0]), FIXED_TIMESTAMP);

    expect(exported.pins.map((pin) => pin.pinString)).toEqual([DEATH_BADGE, CAST_FILTER]);
    expect(exported.sets.map((set) => set.name)).toEqual(['Raid']);
  });
});

describe('import', () => {
  it('round-trips an export into an empty library', () => {
    const exported = JSON.stringify(exportLibrary(sharedLibrary(), FIXED_TIMESTAMP));

    const { library, summary } = mergeImport(
      createEmptyLibrary(),
      parseLibraryExport(exported),
      createSequentialFactory(),
    );

    expect(summary).toEqual({ addedPins: 3, reusedPins: 0, addedSets: 1, skippedSets: 0 });
    expect(library.sets[0]?.pinIds.map((id) => library.pins.find((pin) => pin.id === id)?.pinString)).toEqual([
      DEATH_BADGE,
      CAST_FILTER,
    ]);
  });

  it('round-trips saved views of pins and sets', () => {
    const factory = createSequentialFactory();
    const library = addPinsAsSet(
      addPin(createEmptyLibrary(), { ...pinDraft('Moonfire', MOONFIRE_DECORATOR), viewParams: { type: 'casts' } }, factory),
      [DEATH_BADGE],
      { name: 'Raid', description: '', tags: [], viewParams: { type: 'damage-taken', ability: '1304424' } },
      factory,
    );
    const exported = JSON.stringify(exportLibrary(library, FIXED_TIMESTAMP));

    const { library: imported } = mergeImport(createEmptyLibrary(), parseLibraryExport(exported), factory);

    expect(imported.pins.map((pin) => pin.viewParams)).toEqual([{ type: 'casts' }, undefined]);
    expect(imported.sets[0]?.viewParams).toEqual({ type: 'damage-taken', ability: '1304424' });
  });

  it('imports export files from schema version 1 without saved views', () => {
    const imported = parseLibraryExport(VERSION_1_EXPORT);

    const { library, summary } = mergeImport(createEmptyLibrary(), imported, createSequentialFactory());

    expect(imported.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(summary).toEqual({ addedPins: 1, reusedPins: 0, addedSets: 1, skippedSets: 0 });
    expect(library.pins[0]).toMatchObject({ name: 'Deaths', pinString: DEATH_BADGE, tags: ['raid'] });
    expect(library.pins[0]).not.toHaveProperty('viewParams');
    expect(library.sets[0]).not.toHaveProperty('viewParams');
    expect(library.sets[0]?.pinIds).toEqual([library.pins[0]?.id]);
  });

  it('drops report-specific params from imported views, so a view cannot pin a fight or boss', () => {
    const exported = exportLibrary(createEmptyLibrary(), FIXED_TIMESTAMP);
    const fileContent = JSON.stringify({
      ...exported,
      pins: [
        {
          id: 'pin',
          name: 'Deaths',
          description: '',
          tags: [],
          pinString: DEATH_BADGE,
          viewParams: { type: 'deaths', fight: '3', boss: '3513', source: '12', view: '' },
          createdAt: FIXED_TIMESTAMP,
          updatedAt: FIXED_TIMESTAMP,
        },
      ],
    });

    expect(parseLibraryExport(fileContent).pins[0]?.viewParams).toEqual({ type: 'deaths' });
  });

  it('reuses identical pins and skips sets that already exist', () => {
    const library = sharedLibrary();
    const exported = parseLibraryExport(JSON.stringify(exportLibrary(library, FIXED_TIMESTAMP)));

    const { library: merged, summary } = mergeImport(library, exported, createSequentialFactory());

    expect(summary).toEqual({ addedPins: 0, reusedPins: 3, addedSets: 0, skippedSets: 1 });
    expect(merged.pins).toHaveLength(3);
    expect(merged.sets).toHaveLength(1);
  });

  it.each([
    ['invalid JSON', '{nope', 'not valid JSON'],
    ['another JSON file', '{"hello":"world"}', 'not an Opposite Pin Library export'],
    [
      'a file from a newer version',
      JSON.stringify({ format: EXPORT_FORMAT, schemaVersion: CURRENT_SCHEMA_VERSION + 1, pins: [], sets: [] }),
      `schema version ${CURRENT_SCHEMA_VERSION + 1}`,
    ],
    [
      'a file with a broken pin',
      JSON.stringify({ ...exportLibrary(createEmptyLibrary(), FIXED_TIMESTAMP), pins: [{ id: 'x' }] }),
      'The export file is invalid',
    ],
  ])('rejects %s with a readable message', (_description, fileContent, expectedMessage) => {
    expect(() => parseLibraryExport(fileContent)).toThrow(ImportFileError);
    expect(() => parseLibraryExport(fileContent)).toThrow(expectedMessage);
  });
});
