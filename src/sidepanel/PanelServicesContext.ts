import { createContext, useContext } from 'react';
import type { DisplayModeController } from '../display/displayMode';
import type { PanelSurface } from '../display/panelPage';
import type { LibraryActions } from '../library/libraryActions';
import type { LibraryStore } from '../library/libraryStore';
import type { ActiveReportStore } from './services/activeReportStore';
import type { PinApplier } from './services/pinApplier';

export interface PanelServices {
  readonly surface: PanelSurface;
  readonly displayMode: DisplayModeController;
  readonly libraryStore: LibraryStore;
  readonly libraryActions: LibraryActions;
  readonly activeReportStore: ActiveReportStore;
  readonly pinApplier: PinApplier;
}

export const PanelServicesContext = createContext<PanelServices | null>(null);

export function usePanelServices(): PanelServices {
  const services = useContext(PanelServicesContext);
  if (services === null) {
    throw new Error('usePanelServices must be used inside PanelServicesContext.');
  }
  return services;
}
