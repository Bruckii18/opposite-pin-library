export const PanelSurface = {
  SidePanel: 'side-panel',
  Popup: 'popup',
  Tab: 'tab',
} as const;
export type PanelSurface = (typeof PanelSurface)[keyof typeof PanelSurface];

const PANEL_PAGE = 'sidepanel.html';
const SURFACE_QUERY_PARAM = 'surface';
const PANEL_SURFACES: ReadonlySet<string> = new Set(Object.values(PanelSurface));

export function panelPagePath(surface: PanelSurface): string {
  return `${PANEL_PAGE}?${SURFACE_QUERY_PARAM}=${surface}`;
}

export function readPanelSurface(pageUrl: URL): PanelSurface {
  const surface = pageUrl.searchParams.get(SURFACE_QUERY_PARAM);
  return isPanelSurface(surface) ? surface : PanelSurface.SidePanel;
}

function isPanelSurface(value: string | null): value is PanelSurface {
  return value !== null && PANEL_SURFACES.has(value);
}
