import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createDisplayModeController } from '../display/displayMode';
import { readPanelSurface } from '../display/panelPage';
import { browserEntityFactory } from '../library/entityFactory';
import { createLibraryActions } from '../library/libraryActions';
import { createChromeStorageLibraryRepository } from '../library/libraryRepository';
import { LibraryStore } from '../library/libraryStore';
import { logError } from '../shared/errors';
import { App } from './App';
import { PanelServicesContext, type PanelServices } from './PanelServicesContext';
import { PinApplicationProvider } from './pinApplication/PinApplicationProvider';
import { ActiveReportStore } from './services/activeReportStore';
import { sendApplyPinsRequest } from './services/contentScriptClient';
import { createPinApplier } from './services/pinApplier';
import { StatusProvider } from './status/StatusProvider';
import './styles.css';

const libraryStore = new LibraryStore(createChromeStorageLibraryRepository(chrome.storage.local));
const activeReportStore = new ActiveReportStore(chrome.tabs);
libraryStore.start();
activeReportStore.start();

const panelServices: PanelServices = {
  surface: readPanelSurface(new URL(window.location.href)),
  displayMode: createDisplayModeController({
    action: chrome.action,
    sidePanel: chrome.sidePanel,
    storage: chrome.storage.local,
    reportError: logError,
  }),
  libraryStore,
  libraryActions: createLibraryActions(libraryStore, browserEntityFactory),
  activeReportStore,
  pinApplier: createPinApplier(activeReportStore, sendApplyPinsRequest),
};

const rootElement = document.getElementById('root');
if (rootElement === null) {
  throw new Error('The side panel page is missing its #root element.');
}

createRoot(rootElement).render(
  <StrictMode>
    <PanelServicesContext.Provider value={panelServices}>
      <StatusProvider>
        <PinApplicationProvider>
          <App />
        </PinApplicationProvider>
      </StatusProvider>
    </PanelServicesContext.Provider>
  </StrictMode>,
);
