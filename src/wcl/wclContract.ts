export const WCL_HOSTNAME = 'warcraftlogs.com';
export const REPORT_PATH_PREFIX = '/reports/';

export const PINS_QUERY_PARAM = 'pins';
export const DIALOG_QUERY_PARAM = 'modal';

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
