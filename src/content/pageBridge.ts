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
import { buildReportQuery } from '../wcl/reportQuery';
import { PAGE_ROUTER_GLOBAL } from '../wcl/wclContract';

type RouteQuery = Readonly<Record<string, unknown>>;

interface QueryRouter {
  get(): RouteQuery;
  set(query: RouteQuery): void;
}

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
    // queryRouting.set() replaces the whole query, so every param we don't own must be carried over.
    router.set(buildReportQuery(router.get(), request));
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

function respond(
  request: RoutePinsRequest,
  status: RoutePinsStatus,
  detail: string,
): RoutePinsResponse {
  return { requestId: request.requestId, status, detail };
}
