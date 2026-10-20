import type { LibraryEntry } from '../../library/librarySchema';
import { joinPins } from '../../wcl/pinString';
import { copyToClipboard } from '../services/browserFiles';
import { downloadEntryExport } from '../services/exportDownloads';
import { useStatus } from '../status/StatusContext';
import { useLibraryActions } from './useLibrary';

export interface EntryItemActions {
  copyPins(): void;
  exportEntry(): void;
  duplicate(): void;
  remove(): void;
}

export function useEntryItemActions(entry: LibraryEntry): EntryItemActions {
  const { duplicateEntry, deleteEntry } = useLibraryActions();
  const { trackTask } = useStatus();
  return {
    copyPins: () =>
      void trackTask(
        () => copyToClipboard(joinPins(entry.pins)),
        () =>
          entry.pins.length === 1
            ? 'Pin string copied to the clipboard.'
            : 'Pin strings copied. Paste them into WCL’s Add Pin dialog to add all of them.',
      ),
    exportEntry: () =>
      void trackTask(async () => downloadEntryExport(entry), () => `Exported "${entry.name}".`),
    duplicate: () => void trackTask(() => duplicateEntry(entry.id), () => `Duplicated "${entry.name}".`),
    remove: () => void trackTask(() => deleteEntry(entry.id), () => `Deleted "${entry.name}".`),
  };
}
