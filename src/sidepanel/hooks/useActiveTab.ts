import { useSyncExternalStore } from 'react';
import { usePanelServices } from '../PanelServicesContext';
import type { ActiveTabState } from '../services/activeReportStore';

export function useActiveTab(): ActiveTabState {
  const { activeReportStore } = usePanelServices();
  return useSyncExternalStore(activeReportStore.subscribe, activeReportStore.getSnapshot);
}
