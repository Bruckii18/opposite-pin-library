export const WCL_HOSTNAME = 'warcraftlogs.com';
export const REPORT_PATH_PREFIX = '/reports/';

export const PINS_QUERY_PARAM = 'pins';
export const DIALOG_QUERY_PARAM = 'modal';

// Report-independent params only, so a saved view works on any report. Report-specific params
// (fight, source, target, boss, difficulty, wipes, start, end) must never be added here.
export const ViewQueryParam = {
  Type: 'type',
  Spells: 'spells',
  Hostility: 'hostility',
  Ability: 'ability',
  Layout: 'view',
} as const;
export type ViewQueryParam = (typeof ViewQueryParam)[keyof typeof ViewQueryParam];
export const VIEW_QUERY_PARAMS: readonly ViewQueryParam[] = Object.values(ViewQueryParam);

export const WclTab = {
  Summary: 'summary',
  DamageDone: 'damage-done',
  DamageTaken: 'damage-taken',
  Healing: 'healing',
  Threat: 'threat',
  Buffs: 'buffs',
  Debuffs: 'debuffs',
  Deaths: 'deaths',
  Interrupts: 'interrupts',
  Dispels: 'dispels',
  Resources: 'resources',
  Casts: 'casts',
} as const;
export type WclTab = (typeof WclTab)[keyof typeof WclTab];
export const WCL_TAB_KEYS: readonly WclTab[] = Object.values(WclTab);

type TabQuery = Readonly<{ [ViewQueryParam.Type]: string; [ViewQueryParam.Spells]?: string }>;

interface WclTabDefinition {
  readonly label: string;
  readonly query: TabQuery;
}

// Buffs and Debuffs share type=auras and differ only in `spells`, so a tab is more than a `type`.
export const WCL_TABS: Readonly<Record<WclTab, WclTabDefinition>> = {
  [WclTab.Summary]: { label: 'Summary', query: { type: 'summary' } },
  [WclTab.DamageDone]: { label: 'Damage Done', query: { type: 'damage-done' } },
  [WclTab.DamageTaken]: { label: 'Damage Taken', query: { type: 'damage-taken' } },
  [WclTab.Healing]: { label: 'Healing', query: { type: 'healing' } },
  [WclTab.Threat]: { label: 'Threat', query: { type: 'threat' } },
  [WclTab.Buffs]: { label: 'Buffs', query: { type: 'auras' } },
  [WclTab.Debuffs]: { label: 'Debuffs', query: { type: 'auras', spells: 'debuffs' } },
  [WclTab.Deaths]: { label: 'Deaths', query: { type: 'deaths' } },
  [WclTab.Interrupts]: { label: 'Interrupts', query: { type: 'interrupts' } },
  [WclTab.Dispels]: { label: 'Dispels', query: { type: 'dispels' } },
  [WclTab.Resources]: { label: 'Resources', query: { type: 'resources' } },
  [WclTab.Casts]: { label: 'Casts', query: { type: 'casts' } },
};

export const WclHostility = {
  Friendlies: '0',
  Enemies: '1',
} as const;
export type WclHostility = (typeof WclHostility)[keyof typeof WclHostility];
export const WCL_HOSTILITY_KEYS: readonly WclHostility[] = Object.values(WclHostility);
export const WCL_DEFAULT_HOSTILITY: WclHostility = WclHostility.Friendlies;

export const WCL_HOSTILITY_LABELS: Readonly<Record<WclHostility, string>> = {
  [WclHostility.Friendlies]: 'Friendlies',
  [WclHostility.Enemies]: 'Enemies',
};

export const WclLayout = {
  Events: 'events',
  Timeline: 'timeline',
} as const;
export type WclLayout = (typeof WclLayout)[keyof typeof WclLayout];
export const WCL_LAYOUT_KEYS: readonly WclLayout[] = Object.values(WclLayout);
export const WCL_DEFAULT_LAYOUT_LABEL = 'Tables';

export const WCL_LAYOUT_LABELS: Readonly<Record<WclLayout, string>> = {
  [WclLayout.Events]: 'Events',
  [WclLayout.Timeline]: 'Timeline',
};

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
