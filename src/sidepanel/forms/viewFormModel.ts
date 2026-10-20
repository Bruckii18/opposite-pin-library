import { pickViewParams, type ViewParams } from '../../wcl/viewParams';
import { VIEW_QUERY_PARAMS, ViewQueryParam } from '../../wcl/wclContract';

export interface ViewParamField {
  readonly label: string;
  readonly hint: string;
  readonly isNumeric: boolean;
}

export type ViewFormParams = Readonly<Partial<Record<ViewQueryParam, string>>>;

export interface ViewFormValues {
  readonly isEnabled: boolean;
  readonly params: ViewFormParams;
}

export type ViewFormValidation =
  | { readonly valid: true; readonly viewParams: ViewParams | undefined }
  | { readonly valid: false; readonly error: string };

export const VIEW_PARAM_FIELDS: Readonly<Record<ViewQueryParam, ViewParamField>> = {
  [ViewQueryParam.Tab]: {
    label: 'Tab',
    hint: 'For example damage-taken, casts, auras, debuffs or deaths.',
    isNumeric: false,
  },
  [ViewQueryParam.Ability]: {
    label: 'Ability (spell ID)',
    hint: 'The spell ID from the ability dropdown, for example 1304424.',
    isNumeric: true,
  },
  [ViewQueryParam.Layout]: {
    label: 'Layout',
    hint: 'For example events or timeline. Leave it empty for Tables.',
    isNumeric: false,
  },
};

export const CAPTURE_VIEW_TOGGLE_LABEL = 'Also save current view (tab, ability, layout)';
export const SAVED_VIEW_TOGGLE_LABEL = 'Also switch the report view (tab, ability, layout)';

const NUMERIC_PATTERN = /^\d+$/;
const DEFAULT_VIEW_SUMMARY = 'default';
const DEFAULT_VIEW_DESCRIPTION = 'the default report view';
const SUMMARY_SEPARATOR = ' · ';

export const EMPTY_VIEW_FORM_VALUES: ViewFormValues = viewFormValuesFromSaved(undefined);

export function viewFormValuesFromSaved(viewParams: ViewParams | undefined): ViewFormValues {
  return { isEnabled: viewParams !== undefined, params: viewParams ?? {} };
}

export function viewFormValuesForCapture(currentView: ViewParams): ViewFormValues {
  return { isEnabled: false, params: currentView };
}

export function validateViewForm(values: ViewFormValues): ViewFormValidation {
  if (!values.isEnabled) {
    return { valid: true, viewParams: undefined };
  }
  const viewParams = pickViewParams(trimValues(values.params));
  const invalidParam = VIEW_QUERY_PARAMS.find(
    (param) => !isValidParamValue(VIEW_PARAM_FIELDS[param], viewParams[param]),
  );
  if (invalidParam !== undefined) {
    return { valid: false, error: `${VIEW_PARAM_FIELDS[invalidParam].label} must be a number.` };
  }
  return { valid: true, viewParams };
}

export function summarizeViewParams(viewParams: ViewParams): string {
  const values = VIEW_QUERY_PARAMS.map((param) => viewParams[param]).filter(
    (value) => value !== undefined,
  );
  return values.length === 0 ? DEFAULT_VIEW_SUMMARY : values.join(SUMMARY_SEPARATOR);
}

export function describeViewParams(viewParams: ViewParams): string {
  const parts = VIEW_QUERY_PARAMS.flatMap((param) => {
    const value = viewParams[param];
    return value === undefined ? [] : [`${VIEW_PARAM_FIELDS[param].label}: ${value}`];
  });
  return parts.length === 0 ? DEFAULT_VIEW_DESCRIPTION : parts.join(', ');
}

function trimValues(params: ViewFormParams): Record<string, string> {
  return Object.fromEntries(
    Object.entries(params).map(([param, value]) => [param, (value ?? '').trim()]),
  );
}

function isValidParamValue(field: ViewParamField, value: string | undefined): boolean {
  return value === undefined || !field.isNumeric || NUMERIC_PATTERN.test(value);
}
