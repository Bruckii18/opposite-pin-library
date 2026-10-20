import { joinPins, splitPins, type PinString } from './pinString';
import { buildReportQuery, pickViewQuery, type QueryChange } from './reportQuery';
import { viewParamsFromQuery, type ViewParams, type ViewQuery } from './viewParams';
import { PINS_QUERY_PARAM, REPORT_PATH_PREFIX, WCL_HOSTNAME } from './wclContract';

const SECURE_PROTOCOL = 'https:';

export function parseWclReportUrl(rawUrl: string | undefined): URL | null {
  const url = rawUrl === undefined ? null : URL.parse(rawUrl);
  return url !== null && isWclReportUrl(url) ? url : null;
}

export function isWclReportUrl(url: URL): boolean {
  return (
    url.protocol === SECURE_PROTOCOL &&
    isWclHostname(url.hostname) &&
    url.pathname.startsWith(REPORT_PATH_PREFIX)
  );
}

export function readActivePins(reportUrl: URL): PinString[] {
  const pinsQueryValue = reportUrl.searchParams.get(PINS_QUERY_PARAM);
  return pinsQueryValue === null ? [] : splitPins(pinsQueryValue);
}

export function readViewParams(reportUrl: URL): ViewParams {
  return viewParamsFromQuery(readQuery(reportUrl));
}

export function readViewQuery(reportUrl: URL): ViewQuery {
  return pickViewQuery(readQuery(reportUrl));
}

export function toPinsQueryValue(pins: readonly PinString[]): string | null {
  return pins.length === 0 ? null : joinPins(pins);
}

export function withQueryChange(reportUrl: URL, change: QueryChange): URL {
  const updatedUrl = new URL(reportUrl);
  updatedUrl.search = new URLSearchParams(buildReportQuery(readQuery(reportUrl), change)).toString();
  return updatedUrl;
}

function readQuery(reportUrl: URL): Record<string, string> {
  return Object.fromEntries(reportUrl.searchParams);
}

function isWclHostname(hostname: string): boolean {
  return hostname === WCL_HOSTNAME || hostname.endsWith(`.${WCL_HOSTNAME}`);
}
