import {
  isAbilityId,
  isWclLayout,
  isWclTab,
  sanitizeViewParams,
  type ViewParams,
} from '../../wcl/viewParams';
import {
  WCL_DEFAULT_HOSTILITY,
  WCL_DEFAULT_LAYOUT_LABEL,
  WCL_HOSTILITY_KEYS,
  WCL_HOSTILITY_LABELS,
  WCL_LAYOUT_KEYS,
  WCL_LAYOUT_LABELS,
  WCL_TAB_KEYS,
  WCL_TABS,
  type WclHostility,
  type WclLayout,
  type WclTab,
} from '../../wcl/wclContract';

export interface ViewFormValues {
  readonly isEnabled: boolean;
  readonly tab: WclTab | undefined;
  readonly hostility: WclHostility;
  readonly ability: string;
  readonly layout: WclLayout | undefined;
}

export type ViewFormValidation =
  | { readonly valid: true; readonly viewParams: ViewParams | undefined }
  | { readonly valid: false; readonly error: string };

export interface ViewOption<Value extends string> {
  readonly value: Value;
  readonly label: string;
}

export const ViewFieldLabel = {
  Tab: 'Tab',
  Hostility: 'Units',
  Ability: 'Ability (spell ID)',
  Layout: 'Layout',
} as const;

export const NO_PARAM_OPTION_VALUE = '';
const DEFAULT_TAB_LABEL = 'Default';

export const TAB_OPTIONS: readonly ViewOption<string>[] = [
  { value: NO_PARAM_OPTION_VALUE, label: DEFAULT_TAB_LABEL },
  ...WCL_TAB_KEYS.map((tab) => ({ value: tab, label: WCL_TABS[tab].label })),
];

export const LAYOUT_OPTIONS: readonly ViewOption<string>[] = [
  { value: NO_PARAM_OPTION_VALUE, label: WCL_DEFAULT_LAYOUT_LABEL },
  ...WCL_LAYOUT_KEYS.map((layout) => ({ value: layout, label: WCL_LAYOUT_LABELS[layout] })),
];

export const HOSTILITY_OPTIONS: readonly ViewOption<WclHostility>[] = WCL_HOSTILITY_KEYS.map(
  (hostility) => ({ value: hostility, label: WCL_HOSTILITY_LABELS[hostility] }),
);

export const CAPTURE_VIEW_TOGGLE_LABEL = 'Also save current view (tab, units, ability, layout)';
export const SAVED_VIEW_TOGGLE_LABEL = 'Also switch the report view (tab, units, ability, layout)';

const DEFAULT_VIEW_SUMMARY = 'default';
const DEFAULT_VIEW_DESCRIPTION = 'the default report view';
const SUMMARY_SEPARATOR = ' · ';
const DESCRIPTION_SEPARATOR = ', ';

interface LabeledViewParam {
  readonly field: string;
  readonly value: string;
}

export const EMPTY_VIEW_FORM_VALUES: ViewFormValues = viewFormValuesFromSaved(undefined);

export function viewFormValuesFromSaved(viewParams: ViewParams | undefined): ViewFormValues {
  return { isEnabled: viewParams !== undefined, ...viewFieldValues(viewParams ?? {}) };
}

export function viewFormValuesForCapture(currentView: ViewParams): ViewFormValues {
  return { isEnabled: false, ...viewFieldValues(currentView) };
}

export function tabFromOption(value: string): WclTab | undefined {
  return isWclTab(value) ? value : undefined;
}

export function layoutFromOption(value: string): WclLayout | undefined {
  return isWclLayout(value) ? value : undefined;
}

export function validateViewForm(values: ViewFormValues): ViewFormValidation {
  if (!values.isEnabled) {
    return { valid: true, viewParams: undefined };
  }
  const ability = values.ability.trim();
  if (ability !== '' && !isAbilityId(ability)) {
    return { valid: false, error: `${ViewFieldLabel.Ability} must be a number.` };
  }
  return { valid: true, viewParams: toViewParams({ ...values, ability }) };
}

export function summarizeViewParams(viewParams: ViewParams): string {
  const values = labelViewParams(viewParams).map(({ value }) => value);
  return values.length === 0 ? DEFAULT_VIEW_SUMMARY : values.join(SUMMARY_SEPARATOR);
}

export function describeViewParams(viewParams: ViewParams): string {
  const parts = labelViewParams(viewParams).map(({ field, value }) => `${field}: ${value}`);
  return parts.length === 0 ? DEFAULT_VIEW_DESCRIPTION : parts.join(DESCRIPTION_SEPARATOR);
}

function viewFieldValues({ tab, hostility, ability, view }: ViewParams): Omit<ViewFormValues, 'isEnabled'> {
  return { tab, hostility: hostility ?? WCL_DEFAULT_HOSTILITY, ability: ability ?? '', layout: view };
}

function toViewParams({ tab, hostility, ability, layout }: ViewFormValues): ViewParams {
  return sanitizeViewParams({
    tab,
    hostility: hostility === WCL_DEFAULT_HOSTILITY ? undefined : hostility,
    ability,
    view: layout,
  });
}

function labelViewParams({ tab, hostility, ability, view }: ViewParams): readonly LabeledViewParam[] {
  return [
    ...(tab === undefined ? [] : [{ field: ViewFieldLabel.Tab, value: WCL_TABS[tab].label }]),
    ...(hostility === undefined
      ? []
      : [{ field: ViewFieldLabel.Hostility, value: WCL_HOSTILITY_LABELS[hostility] }]),
    ...(ability === undefined ? [] : [{ field: ViewFieldLabel.Ability, value: ability }]),
    ...(view === undefined ? [] : [{ field: ViewFieldLabel.Layout, value: WCL_LAYOUT_LABELS[view] }]),
  ];
}
