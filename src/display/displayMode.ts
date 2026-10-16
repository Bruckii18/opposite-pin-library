import { panelPagePath, PanelSurface } from './panelPage';

export const DisplayMode = {
  SidePanel: 'side-panel',
  Popup: 'popup',
} as const;
export type DisplayMode = (typeof DisplayMode)[keyof typeof DisplayMode];

export interface DisplayModeApis {
  readonly action: Pick<typeof chrome.action, 'setPopup' | 'openPopup'>;
  readonly sidePanel: Pick<typeof chrome.sidePanel, 'setPanelBehavior'>;
  readonly storage: Pick<chrome.storage.StorageArea, 'get' | 'set'>;
  readonly reportError: (message: string, error: unknown) => void;
}

export interface DisplayModeController {
  restore(): Promise<void>;
  fallBackToPopup(): Promise<void>;
  useSidePanel(): Promise<void>;
}

const DISPLAY_MODE_STORAGE_KEY = 'displayMode';
const NO_POPUP = '';

export function createDisplayModeController(apis: DisplayModeApis): DisplayModeController {
  const setPanelBehavior = (openPanelOnActionClick: boolean): void => {
    // Not awaited: Arc exposes chrome.sidePanel but never settles its promises.
    apis.sidePanel
      .setPanelBehavior({ openPanelOnActionClick })
      .catch((error: unknown) => apis.reportError('Could not update the side panel behavior.', error));
  };

  const applyDisplayMode = async (mode: DisplayMode): Promise<void> => {
    const isPopupMode = mode === DisplayMode.Popup;
    setPanelBehavior(!isPopupMode);
    await apis.action.setPopup({ popup: isPopupMode ? panelPagePath(PanelSurface.Popup) : NO_POPUP });
  };

  const storeDisplayMode = (mode: DisplayMode): Promise<void> =>
    apis.storage.set({ [DISPLAY_MODE_STORAGE_KEY]: mode });

  return {
    async restore() {
      const stored = await apis.storage.get(DISPLAY_MODE_STORAGE_KEY);
      const isPopupMode = stored[DISPLAY_MODE_STORAGE_KEY] === DisplayMode.Popup;
      await applyDisplayMode(isPopupMode ? DisplayMode.Popup : DisplayMode.SidePanel);
    },

    async fallBackToPopup() {
      await applyDisplayMode(DisplayMode.Popup);
      await apis.action
        .openPopup()
        .catch((error: unknown) => apis.reportError('Could not open the popup right away.', error));
      await storeDisplayMode(DisplayMode.Popup);
    },

    async useSidePanel() {
      await storeDisplayMode(DisplayMode.SidePanel);
      await applyDisplayMode(DisplayMode.SidePanel);
    },
  };
}
