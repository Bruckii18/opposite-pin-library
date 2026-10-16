import { useSyncExternalStore } from 'react';
import type { LibraryActions } from '../../library/libraryActions';
import type { LibraryState } from '../../library/libraryStore';
import { usePanelServices } from '../PanelServicesContext';

export function useLibraryState(): LibraryState {
  const { libraryStore } = usePanelServices();
  return useSyncExternalStore(libraryStore.subscribe, libraryStore.getSnapshot);
}

export function useLibraryActions(): LibraryActions {
  return usePanelServices().libraryActions;
}
