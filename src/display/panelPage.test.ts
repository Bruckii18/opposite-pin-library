import { describe, expect, it } from 'vitest';
import { panelPagePath, PanelSurface, readPanelSurface } from './panelPage';

const EXTENSION_ORIGIN = 'chrome-extension://abcdefghijklmnop/';

describe('panel page', () => {
  it('builds page paths that read back as the same surface', () => {
    for (const surface of Object.values(PanelSurface)) {
      expect(readPanelSurface(new URL(panelPagePath(surface), EXTENSION_ORIGIN))).toBe(surface);
    }
  });

  it('treats the plain page and unknown surfaces as the side panel', () => {
    expect(readPanelSurface(new URL('sidepanel.html', EXTENSION_ORIGIN))).toBe(PanelSurface.SidePanel);
    expect(readPanelSurface(new URL('sidepanel.html?surface=window', EXTENSION_ORIGIN))).toBe(
      PanelSurface.SidePanel,
    );
  });
});
