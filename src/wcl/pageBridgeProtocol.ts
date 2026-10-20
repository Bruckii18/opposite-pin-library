import { isViewParams, type ViewParams } from './viewParams';

export const ROUTE_PINS_REQUEST_EVENT = 'opposite-pin-library:route-pins-request';
export const ROUTE_PINS_RESPONSE_EVENT = 'opposite-pin-library:route-pins-response';

export const RoutePinsStatus = {
  Routed: 'routed',
  BridgeMissing: 'bridge-missing',
  RouterMissing: 'router-missing',
  RouterFailed: 'router-failed',
} as const;
export type RoutePinsStatus = (typeof RoutePinsStatus)[keyof typeof RoutePinsStatus];

export interface RoutePinsRequest {
  readonly requestId: string;
  readonly pinsQueryValue: string | null;
  readonly viewParams: ViewParams | null;
}

export interface RoutePinsResponse {
  readonly requestId: string;
  readonly status: RoutePinsStatus;
  readonly detail: string;
}

const ROUTE_PINS_STATUSES: ReadonlySet<unknown> = new Set(Object.values(RoutePinsStatus));

export function encodeBridgeMessage(message: RoutePinsRequest | RoutePinsResponse): string {
  return JSON.stringify(message);
}

export function decodeRoutePinsRequest(eventDetail: unknown): RoutePinsRequest | null {
  const candidate = parseBridgeJson(eventDetail);
  return isRecord(candidate) &&
    typeof candidate.requestId === 'string' &&
    (typeof candidate.pinsQueryValue === 'string' || candidate.pinsQueryValue === null) &&
    (isViewParams(candidate.viewParams) || candidate.viewParams === null)
    ? {
        requestId: candidate.requestId,
        pinsQueryValue: candidate.pinsQueryValue,
        viewParams: candidate.viewParams,
      }
    : null;
}

export function decodeRoutePinsResponse(eventDetail: unknown): RoutePinsResponse | null {
  const candidate = parseBridgeJson(eventDetail);
  return isRecord(candidate) &&
    typeof candidate.requestId === 'string' &&
    isRoutePinsStatus(candidate.status) &&
    typeof candidate.detail === 'string'
    ? { requestId: candidate.requestId, status: candidate.status, detail: candidate.detail }
    : null;
}

function parseBridgeJson(eventDetail: unknown): unknown {
  if (typeof eventDetail !== 'string') {
    return null;
  }
  try {
    return JSON.parse(eventDetail);
  } catch {
    // Any page script can dispatch these events; malformed payloads are not ours and are ignored.
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isRoutePinsStatus(value: unknown): value is RoutePinsStatus {
  return ROUTE_PINS_STATUSES.has(value);
}
