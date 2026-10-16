import { createDisplayModeController } from '../display/displayMode';
import { logError } from '../shared/errors';

const displayMode = createDisplayModeController({
  action: chrome.action,
  sidePanel: chrome.sidePanel,
  storage: chrome.storage.local,
  reportError: logError,
});

const reportDisplayModeFailure = (error: unknown): void =>
  logError('Could not apply the display mode.', error);

displayMode.restore().catch(reportDisplayModeFailure);

// Chrome opens the side panel itself and never fires this event. Browsers without a working
// side panel (Arc) deliver the click here instead, so the extension switches to a popup.
chrome.action.onClicked.addListener(() => {
  displayMode.fallBackToPopup().catch(reportDisplayModeFailure);
});
