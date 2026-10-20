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
import {
  DIALOG_QUERY_PARAM,
  PAGE_ROUTER_GLOBAL,
  PINS_QUERY_PARAM,
  VIEW_QUERY_PARAMS,
} from '../wcl/wclContract';

type RouteQuery = Record<string, string>;

interface QueryRouter {
  get(): RouteQuery;
  set(query: RouteQuery): void;
}

const PIN_QUERY_PARAMS: ReadonlySet<string> = new Set([DIALOG_QUERY_PARAM, PINS_QUERY_PARAM]);
const PIN_AND_VIEW_QUERY_PARAMS: ReadonlySet<string> = new Set([...PIN_QUERY_PARAMS, ...VIEW_QUERY_PARAMS]);

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
    router.set(withRequestedParams(router.get(), request));
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

// queryRouting.set() replaces the whole query, so every param we don't own must be carried over.
function withRequestedParams(
  query: RouteQuery,
  { pinsQueryValue, viewParams }: RoutePinsRequest,
): RouteQuery {
  const replacedParams = viewParams === null ? PIN_QUERY_PARAMS : PIN_AND_VIEW_QUERY_PARAMS;
  const preservedQuery = Object.fromEntries(
    Object.entries(query).filter(([param]) => !replacedParams.has(param)),
  );
  return {
    ...preservedQuery,
    ...viewParams,
    ...(pinsQueryValue === null ? {} : { [PINS_QUERY_PARAM]: pinsQueryValue }),
  };
}

function respond(
  request: RoutePinsRequest,
  status: RoutePinsStatus,
  detail: string,
): RoutePinsResponse {
  return { requestId: request.requestId, status, detail };
}
