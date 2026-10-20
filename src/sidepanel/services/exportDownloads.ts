import type { LibraryEntry, PinLibrary } from '../../library/librarySchema';
import { exportEntry, exportLibrary } from '../../library/libraryTransfer';
import { downloadJsonFile } from './browserFiles';
import { entryExportFileName, libraryExportFileName } from './exportFileNames';

export function downloadLibraryExport(library: PinLibrary): void {
  const exportedAt = new Date().toISOString();
  downloadJsonFile(libraryExportFileName(exportedAt), exportLibrary(library, exportedAt));
}

export function downloadEntryExport(entry: LibraryEntry): void {
  const exportedAt = new Date().toISOString();
  downloadJsonFile(entryExportFileName(entry.name, exportedAt), exportEntry(entry, exportedAt));
}
