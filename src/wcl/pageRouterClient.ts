import {
  decodeRoutePinsResponse,
  encodeBridgeMessage,
  ROUTE_PINS_REQUEST_EVENT,
  ROUTE_PINS_RESPONSE_EVENT,
  RoutePinsStatus,
  type RoutePinsResponse,
} from './pageBridgeProtocol';
import type { ViewParams } from './viewParams';

export type RoutePins = (
  pinsQueryValue: string | null,
  viewParams: ViewParams | null,
) => Promise<RoutePinsResponse>;

export function createPageRouterClient(eventTarget: EventTarget, timeoutMs: number): RoutePins {
  return (pinsQueryValue, viewParams) =>
    new Promise((resolve) => {
      const requestId = crypto.randomUUID();
      const timeoutId = setTimeout(
        () => finish({ requestId, status: RoutePinsStatus.BridgeMissing, detail: 'The page bridge did not answer.' }),
        timeoutMs,
      );

      function handleResponse(event: Event): void {
        const response = decodeRoutePinsResponse(event instanceof CustomEvent ? event.detail : null);
        if (response?.requestId === requestId) {
          finish(response);
        }
      }

      function finish(response: RoutePinsResponse): void {
        clearTimeout(timeoutId);
        eventTarget.removeEventListener(ROUTE_PINS_RESPONSE_EVENT, handleResponse);
        resolve(response);
      }

      eventTarget.addEventListener(ROUTE_PINS_RESPONSE_EVENT, handleResponse);
      eventTarget.dispatchEvent(
        new CustomEvent(ROUTE_PINS_REQUEST_EVENT, {
          detail: encodeBridgeMessage({ requestId, pinsQueryValue, viewParams }),
        }),
      );
    });
}
