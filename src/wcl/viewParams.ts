import { isRecord } from '../shared/records';
import {
  ViewQueryParam,
  WCL_HOSTILITY_KEYS,
  WCL_LAYOUT_KEYS,
  WCL_TAB_KEYS,
  WCL_TABS,
  WclTab,
  type WclHostility,
  type WclLayout,
} from './wclContract';

export type ViewParams = Readonly<{
  tab?: WclTab;
  hostility?: WclHostility;
  ability?: string;
  view?: WclLayout;
}>;

export type ViewQuery = Readonly<Partial<Record<ViewQueryParam, string>>>;

type UncheckedRecord = Readonly<Record<string, unknown>>;

const ABILITY_ID_PATTERN = /^\d+$/;

const TABS: ReadonlySet<unknown> = new Set(WCL_TAB_KEYS);
const HOSTILITIES: ReadonlySet<unknown> = new Set(WCL_HOSTILITY_KEYS);
const LAYOUTS: ReadonlySet<unknown> = new Set(WCL_LAYOUT_KEYS);

// Earlier versions stored the raw `type` and let users type one in, so these invalid WCL values
// exist in saved data. WCL half-loads the tab for them.
const LEGACY_TAB_TYPES: ReadonlyMap<unknown, WclTab> = new Map([
  ['buffs', WclTab.Buffs],
  ['debuffs', WclTab.Debuffs],
]);

export function isWclTab(value: unknown): value is WclTab {
  return TABS.has(value);
}

function isWclHostility(value: unknown): value is WclHostility {
  return HOSTILITIES.has(value);
}

export function isWclLayout(value: unknown): value is WclLayout {
  return LAYOUTS.has(value);
}

export function isAbilityId(value: unknown): value is string {
  return typeof value === 'string' && ABILITY_ID_PATTERN.test(value);
}

export function tabFromQuery(query: UncheckedRecord): WclTab | undefined {
  const type = query[ViewQueryParam.Type];
  const spells = query[ViewQueryParam.Spells];
  const tabsOfType = WCL_TAB_KEYS.filter((tab) => WCL_TABS[tab].query.type === type);
  return (
    tabsOfType.find((tab) => WCL_TABS[tab].query.spells === spells) ??
    tabsOfType.find((tab) => WCL_TABS[tab].query.spells === undefined) ??
    LEGACY_TAB_TYPES.get(type)
  );
}

export function viewParamsFromQuery(query: UncheckedRecord): ViewParams {
  return sanitizeViewParams({
    tab: tabFromQuery(query),
    hostility: query[ViewQueryParam.Hostility],
    ability: query[ViewQueryParam.Ability],
    view: query[ViewQueryParam.Layout],
  });
}

export function toQueryParams(viewParams: ViewParams): ViewQuery {
  const { tab, hostility, ability, view } = sanitizeViewParams(viewParams);
  return {
    ...(tab === undefined ? {} : WCL_TABS[tab].query),
    ...(hostility === undefined ? {} : { [ViewQueryParam.Hostility]: hostility }),
    ...(ability === undefined ? {} : { [ViewQueryParam.Ability]: ability }),
    ...(view === undefined ? {} : { [ViewQueryParam.Layout]: view }),
  };
}

export function sanitizeViewParams({ tab, hostility, ability, view }: UncheckedRecord): ViewParams {
  return {
    ...(isWclTab(tab) ? { tab } : {}),
    ...(isWclHostility(hostility) ? { hostility } : {}),
    ...(isAbilityId(ability) ? { ability } : {}),
    ...(isWclLayout(view) ? { view } : {}),
  };
}

export function isViewParams(value: unknown): value is ViewParams {
  if (!isRecord(value)) {
    return false;
  }
  const sanitized = sanitizeViewParams(value);
  return Object.keys(value).every((key) => Object.hasOwn(sanitized, key));
}

export function haveSameViewParams(first: ViewParams, second: ViewParams): boolean {
  return (
    first.tab === second.tab &&
    first.hostility === second.hostility &&
    first.ability === second.ability &&
    first.view === second.view
  );
}
