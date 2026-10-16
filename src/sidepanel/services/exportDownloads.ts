import type { PinLibrary, PinSet } from '../../library/librarySchema';
import { exportLibrary, exportSet } from '../../library/libraryTransfer';
import { downloadJsonFile } from './browserFiles';
import { libraryExportFileName, setExportFileName } from './exportFileNames';

export function downloadLibraryExport(library: PinLibrary): void {
  const exportedAt = new Date().toISOString();
  downloadJsonFile(libraryExportFileName(exportedAt), exportLibrary(library, exportedAt));
}

export function downloadSetExport(library: PinLibrary, set: PinSet): void {
  const exportedAt = new Date().toISOString();
  downloadJsonFile(setExportFileName(set.name, exportedAt), exportSet(library, set, exportedAt));
}
