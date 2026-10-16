import { describe, expect, it } from 'vitest';
import { createSequentialFactory, FIXED_TIMESTAMP, pinDraft, requireDefined } from '../test/libraryFixtures';
import { CAST_FILTER, DEATH_BADGE, MOONFIRE_DECORATOR } from '../test/pinFixtures';
import { addPin, addPinsAsSet } from './libraryOperations';
import { createEmptyLibrary, type PinLibrary } from './librarySchema';
import {
  EXPORT_FORMAT,
  exportLibrary,
  exportSet,
  ImportFileError,
  mergeImport,
  parseLibraryExport,
} from './libraryTransfer';

function sharedLibrary(): PinLibrary {
  const factory = createSequentialFactory();
  const withPin = addPin(createEmptyLibrary(), pinDraft('Moonfire', MOONFIRE_DECORATOR), factory);
  return addPinsAsSet(withPin, [DEATH_BADGE, CAST_FILTER], { name: 'Raid', description: '', tags: [] }, factory);
}

describe('export', () => {
  it('exports the whole library with format and schema version', () => {
    const exported = exportLibrary(sharedLibrary(), FIXED_TIMESTAMP);

    expect(exported).toMatchObject({ format: EXPORT_FORMAT, schemaVersion: 1, exportedAt: FIXED_TIMESTAMP });
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
      JSON.stringify({ format: EXPORT_FORMAT, schemaVersion: 2, pins: [], sets: [] }),
      'schema version 2',
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
