export const WCL_HOSTNAME = 'warcraftlogs.com';
export const REPORT_PATH_PREFIX = '/reports/';

export const PINS_QUERY_PARAM = 'pins';
export const DIALOG_QUERY_PARAM = 'modal';

// Report-independent params only, so a saved view works on any report. Report-specific params
// (fight, source, target, boss, difficulty, wipes, start, end) must never be added here.
export const ViewQueryParam = {
  Tab: 'type',
  Ability: 'ability',
  Layout: 'view',
} as const;
export type ViewQueryParam = (typeof ViewQueryParam)[keyof typeof ViewQueryParam];
export const VIEW_QUERY_PARAMS: readonly ViewQueryParam[] = Object.values(ViewQueryParam);

export const PIN_SEPARATOR = '^';
export const PIN_FIELD_SEPARATOR = '$';

export const PAGE_ROUTER_GLOBAL = 'queryRouting';

export const PIN_DIALOG_SELECTORS = {
  openButton: '#pins-ui-toggle-tab',
  closeButton: '#pins-ui-close',
  dialog: '#pins-ui',
  pasteTab: '#pins-ui-tab-paste',
  pasteTextarea: '#pins-ui-paste-box',
  createButton: '#pins-ui-create-or-change-pin',
} as const;
