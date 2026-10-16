import type { PinLibrary, PinSet } from '../../library/librarySchema';
import { downloadSetExport } from '../services/exportDownloads';
import { useStatus } from '../status/StatusContext';
import { useLibraryActions } from './useLibrary';

export interface SetItemActions {
  exportSet(): void;
  duplicate(): void;
  remove(): void;
}

export function useSetItemActions(library: PinLibrary, set: PinSet): SetItemActions {
  const { duplicateSet, deleteSet } = useLibraryActions();
  const { trackTask } = useStatus();
  return {
    exportSet: () =>
      void trackTask(
        async () => downloadSetExport(library, set),
        () => `Exported "${set.name}".`,
      ),
    duplicate: () => void trackTask(() => duplicateSet(set.id), () => `Duplicated "${set.name}".`),
    remove: () => void trackTask(() => deleteSet(set.id), () => `Deleted "${set.name}".`),
  };
}
