import { joinPins, splitPins, type PinString } from './pinString';
import { pickViewParams, type ViewParams } from './viewParams';
import {
  DIALOG_QUERY_PARAM,
  PINS_QUERY_PARAM,
  REPORT_PATH_PREFIX,
  VIEW_QUERY_PARAMS,
  WCL_HOSTNAME,
} from './wclContract';

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
  return pickViewParams(Object.fromEntries(reportUrl.searchParams));
}

export function toPinsQueryValue(pins: readonly PinString[]): string | null {
  return pins.length === 0 ? null : joinPins(pins);
}

export function withPins(reportUrl: URL, pins: readonly PinString[]): URL {
  const updatedUrl = new URL(reportUrl);
  const pinsQueryValue = toPinsQueryValue(pins);
  updatedUrl.searchParams.delete(DIALOG_QUERY_PARAM);
  if (pinsQueryValue === null) {
    updatedUrl.searchParams.delete(PINS_QUERY_PARAM);
  } else {
    updatedUrl.searchParams.set(PINS_QUERY_PARAM, pinsQueryValue);
  }
  return updatedUrl;
}

export function withViewParams(reportUrl: URL, viewParams: ViewParams): URL {
  const updatedUrl = new URL(reportUrl);
  for (const param of VIEW_QUERY_PARAMS) {
    const value = viewParams[param];
    if (value === undefined) {
      updatedUrl.searchParams.delete(param);
    } else {
      updatedUrl.searchParams.set(param, value);
    }
  }
  return updatedUrl;
}

function isWclHostname(hostname: string): boolean {
  return hostname === WCL_HOSTNAME || hostname.endsWith(`.${WCL_HOSTNAME}`);
}
