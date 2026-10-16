import { panelPagePath, PanelSurface } from '../../display/panelPage';

export async function closePanel(surface: PanelSurface): Promise<void> {
  if (surface === PanelSurface.Popup) {
    window.close();
    return;
  }
  const currentWindow = await chrome.windows.getCurrent();
  if (currentWindow.id === undefined) {
    throw new Error('Could not determine the browser window of the side panel.');
  }
  await chrome.sidePanel.close({ windowId: currentWindow.id });
}

export async function openLibraryInTab(): Promise<void> {
  await chrome.tabs.create({ url: chrome.runtime.getURL(panelPagePath(PanelSurface.Tab)) });
}
