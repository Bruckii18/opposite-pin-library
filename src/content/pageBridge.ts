import { describeError } from '../shared/errors';
import {
  decodeRoutePinsRequest,
  encodeBridgeMessage,
  ROUTE_PINS_REQUEST_EVENT,
  ROUTE_PINS_RESPONSE_EVENT,
  RoutePinsStatus,
  type RoutePinsRequest,
  type RoutePinsResponse,
} from '../wcl/pageBridgeProtocol';
import { DIALOG_QUERY_PARAM, PAGE_ROUTER_GLOBAL, PINS_QUERY_PARAM } from '../wcl/wclContract';

type RouteQuery = Record<string, string>;

interface QueryRouter {
  get(): RouteQuery;
  set(query: RouteQuery): void;
}

const REPLACED_QUERY_PARAMS: ReadonlySet<string> = new Set([DIALOG_QUERY_PARAM, PINS_QUERY_PARAM]);

window.addEventListener(ROUTE_PINS_REQUEST_EVENT, (event) => {
  const request = decodeRoutePinsRequest(event instanceof CustomEvent ? event.detail : null);
  if (request === null) {
    return;
  }
  window.dispatchEvent(
    new CustomEvent(ROUTE_PINS_RESPONSE_EVENT, { detail: encodeBridgeMessage(routePins(request)) }),
  );
});

function routePins(request: RoutePinsRequest): RoutePinsResponse {
  const router = findQueryRouter();
  if (router === null) {
    return respond(request, RoutePinsStatus.RouterMissing, `window.${PAGE_ROUTER_GLOBAL} is not available.`);
  }
  try {
    router.set(withPinsQueryValue(router.get(), request.pinsQueryValue));
    return respond(request, RoutePinsStatus.Routed, '');
  } catch (error) {
    return respond(request, RoutePinsStatus.RouterFailed, describeError(error));
  }
}

function findQueryRouter(): QueryRouter | null {
  const candidate: unknown = Reflect.get(window, PAGE_ROUTER_GLOBAL);
  return isQueryRouter(candidate) ? candidate : null;
}

function isQueryRouter(candidate: unknown): candidate is QueryRouter {
  return (
    typeof candidate === 'object' &&
    candidate !== null &&
    typeof Reflect.get(candidate, 'get') === 'function' &&
    typeof Reflect.get(candidate, 'set') === 'function'
  );
}

function withPinsQueryValue(query: RouteQuery, pinsQueryValue: string | null): RouteQuery {
  const preservedQuery = Object.fromEntries(
    Object.entries(query).filter(([param]) => !REPLACED_QUERY_PARAMS.has(param)),
  );
  return pinsQueryValue === null
    ? preservedQuery
    : { ...preservedQuery, [PINS_QUERY_PARAM]: pinsQueryValue };
}

function respond(
  request: RoutePinsRequest,
  status: RoutePinsStatus,
  detail: string,
): RoutePinsResponse {
  return { requestId: request.requestId, status, detail };
}
