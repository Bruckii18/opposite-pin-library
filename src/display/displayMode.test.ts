import { describe, expect, it, vi } from 'vitest';
import { createDisplayModeController, DisplayMode, type DisplayModeApis } from './displayMode';

const POPUP_PAGE = 'sidepanel.html?surface=popup';

function fakeBrowser(storedMode?: DisplayMode) {
  const storedItems: Record<string, unknown> = storedMode === undefined ? {} : { displayMode: storedMode };
  const action = {
    setPopup: vi.fn(async () => undefined),
    openPopup: vi.fn(async () => undefined),
  };
  const sidePanel = {
    setPanelBehavior: vi.fn(() => new Promise<void>(() => undefined)),
  };
  const storage = {
    get: vi.fn(async (key: string) => ({ [key]: storedItems[key] })),
    set: vi.fn(async (items: Record<string, unknown>) => {
      Object.assign(storedItems, items);
    }),
  };
  const reportError = vi.fn();
  const apis = { action, sidePanel, storage, reportError } as unknown as DisplayModeApis;
  return { apis, action, sidePanel, reportError, storedItems };
}

describe('display mode controller', () => {
  it('uses the side panel by default, even when the browser never settles side panel calls', async () => {
    const browser = fakeBrowser();

    await createDisplayModeController(browser.apis).restore();

    expect(browser.action.setPopup).toHaveBeenCalledWith({ popup: '' });
    expect(browser.sidePanel.setPanelBehavior).toHaveBeenCalledWith({ openPanelOnActionClick: true });
  });

  it('restores the popup after a browser restart', async () => {
    const browser = fakeBrowser(DisplayMode.Popup);

    await createDisplayModeController(browser.apis).restore();

    expect(browser.action.setPopup).toHaveBeenCalledWith({ popup: POPUP_PAGE });
    expect(browser.sidePanel.setPanelBehavior).toHaveBeenCalledWith({ openPanelOnActionClick: false });
  });

  it('falls back to the popup, opens it right away and remembers the choice', async () => {
    const browser = fakeBrowser();

    await createDisplayModeController(browser.apis).fallBackToPopup();

    expect(browser.action.setPopup).toHaveBeenCalledWith({ popup: POPUP_PAGE });
    expect(browser.action.openPopup).toHaveBeenCalled();
    expect(browser.storedItems.displayMode).toBe(DisplayMode.Popup);
  });

  it('still remembers the popup when it cannot be opened immediately', async () => {
    const browser = fakeBrowser();
    browser.action.openPopup.mockRejectedValueOnce(new Error('not focused'));

    await createDisplayModeController(browser.apis).fallBackToPopup();

    expect(browser.reportError).toHaveBeenCalledWith('Could not open the popup right away.', expect.any(Error));
    expect(browser.storedItems.displayMode).toBe(DisplayMode.Popup);
  });

  it('switches back to the side panel on request', async () => {
    const browser = fakeBrowser(DisplayMode.Popup);

    await createDisplayModeController(browser.apis).useSidePanel();

    expect(browser.storedItems.displayMode).toBe(DisplayMode.SidePanel);
    expect(browser.action.setPopup).toHaveBeenLastCalledWith({ popup: '' });
  });
});
