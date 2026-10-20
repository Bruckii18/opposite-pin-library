import { toQueryParams, type ViewParams, type ViewQuery } from './viewParams';
import { DIALOG_QUERY_PARAM, PINS_QUERY_PARAM, VIEW_QUERY_PARAMS } from './wclContract';

export interface QueryChange {
  readonly pinsQueryValue: string | null;
  readonly viewParams: ViewParams | null;
}

type ReportQuery<Value> = Readonly<Record<string, Value>>;

// Missing values that were stringified somewhere. WCL keeps them as literal query values and
// then shows "undefined" in its dropdowns.
const MISSING_VALUE_STRINGS: ReadonlySet<string> = new Set(['', 'null', 'undefined', 'NaN']);

const PIN_QUERY_PARAMS: ReadonlySet<string> = new Set([DIALOG_QUERY_PARAM, PINS_QUERY_PARAM]);
const PIN_AND_VIEW_QUERY_PARAMS: ReadonlySet<string> = new Set([...PIN_QUERY_PARAMS, ...VIEW_QUERY_PARAMS]);

export function buildReportQuery<Value>(
  currentQuery: ReportQuery<Value>,
  { pinsQueryValue, viewParams }: QueryChange,
): ReportQuery<Value | string> {
  const replacedParams = viewParams === null ? PIN_QUERY_PARAMS : PIN_AND_VIEW_QUERY_PARAMS;
  return withoutMissingValues({
    ...withoutParams(currentQuery, replacedParams),
    ...(viewParams === null ? {} : toQueryParams(viewParams)),
    ...(pinsQueryValue === null ? {} : { [PINS_QUERY_PARAM]: pinsQueryValue }),
  });
}

export function pickViewQuery(query: ReportQuery<unknown>): ViewQuery {
  return Object.fromEntries(
    VIEW_QUERY_PARAMS.flatMap((param) => {
      const value = query[param];
      return typeof value === 'string' && isPresentQueryValue(value) ? [[param, value]] : [];
    }),
  );
}

export function showsView(viewQuery: ViewQuery, viewParams: ViewParams): boolean {
  const targetViewQuery = toQueryParams(viewParams);
  return VIEW_QUERY_PARAMS.every((param) => viewQuery[param] === targetViewQuery[param]);
}

function withoutParams<Value>(query: ReportQuery<Value>, params: ReadonlySet<string>): ReportQuery<Value> {
  return Object.fromEntries(Object.entries(query).filter(([param]) => !params.has(param)));
}

function withoutMissingValues<Value>(query: ReportQuery<Value | undefined>): ReportQuery<Value> {
  return Object.fromEntries(
    Object.entries(query).filter((entry): entry is [string, Value] => isPresentQueryValue(entry[1])),
  );
}

function isPresentQueryValue(value: unknown): boolean {
  return (
    value !== null &&
    value !== undefined &&
    !Number.isNaN(value) &&
    !(typeof value === 'string' && MISSING_VALUE_STRINGS.has(value))
  );
}
