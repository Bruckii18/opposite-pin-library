import { VIEW_QUERY_PARAMS, type ViewQueryParam } from './wclContract';

export type ViewParams = Readonly<Partial<Record<ViewQueryParam, string>>>;

const VIEW_QUERY_PARAM_SET: ReadonlySet<string> = new Set(VIEW_QUERY_PARAMS);

export function pickViewParams(source: Readonly<Record<string, unknown>>): ViewParams {
  const viewParams: Partial<Record<ViewQueryParam, string>> = {};
  for (const param of VIEW_QUERY_PARAMS) {
    const value = source[param];
    if (typeof value === 'string' && value !== '') {
      viewParams[param] = value;
    }
  }
  return viewParams;
}

export function isViewParams(value: unknown): value is ViewParams {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.entries(value).every(
      ([param, paramValue]) =>
        VIEW_QUERY_PARAM_SET.has(param) && typeof paramValue === 'string' && paramValue !== '',
    )
  );
}

export function haveSameViewParams(first: ViewParams, second: ViewParams): boolean {
  return VIEW_QUERY_PARAMS.every((param) => first[param] === second[param]);
}
