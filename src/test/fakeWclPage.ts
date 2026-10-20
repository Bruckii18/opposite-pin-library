import type { PinString } from '../wcl/pinString';
import { readActivePins, toPinsQueryValue, withQueryChange } from '../wcl/reportUrl';
import { PAGE_ROUTER_GLOBAL, PIN_SEPARATOR, PINS_QUERY_PARAM } from '../wcl/wclContract';

const PIN_DIALOG_MARKUP = `
  <a id="pins-ui-toggle-tab" href="?modal=pins">Queries</a>
  <div id="pins-ui" style="display:none">
    <div id="pins-ui-tabs">
      <div id="pins-ui-tab-query" class="pins-ui-tab selected">New Query</div>
      <div id="pins-ui-tab-paste" class="pins-ui-tab">From Paste</div>
      <span id="pins-ui-close"></span>
    </div>
    <textarea id="pins-ui-paste-box"></textarea>
    <input type="button" id="pins-ui-create-or-change-pin" value="Create Pin">
  </div>
`;

export type RoutedQuery = Readonly<Record<string, unknown>>;

export interface FakeQueryRouter {
  readonly routedQueries: readonly RoutedQuery[];
}

export interface FakeWclPage {
  readonly dialog: HTMLElement;
  readonly openButton: HTMLElement;
  readActivePins(): PinString[];
}

export function installFakeWclPage(initialPins: readonly PinString[]): FakeWclPage {
  const pinsQueryValue = toPinsQueryValue(initialPins);
  history.replaceState(null, '', withQueryChange(new URL(location.href), { pinsQueryValue, viewParams: null }).href);
  document.body.innerHTML = PIN_DIALOG_MARKUP;
  const dialog = requireElement('#pins-ui');
  const openButton = requireElement('#pins-ui-toggle-tab');
  const pasteBox = requireElement<HTMLTextAreaElement>('#pins-ui-paste-box');

  openButton.addEventListener('click', (event) => {
    event.preventDefault();
    dialog.style.display = 'block';
  });
  requireElement('#pins-ui-close').addEventListener('click', () => {
    dialog.style.display = 'none';
  });
  requireElement('#pins-ui-tab-paste').addEventListener('click', (event) => {
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.classList.add('selected');
    }
  });
  requireElement('#pins-ui-create-or-change-pin').addEventListener('click', () => {
    appendPinsToUrl(pasteBox.value);
    dialog.style.display = 'none';
  });

  return { dialog, openButton, readActivePins: () => readActivePins(new URL(location.href)) };
}

export function installFakeQueryRouter(): FakeQueryRouter {
  const routedQueries: RoutedQuery[] = [];
  Reflect.set(window, PAGE_ROUTER_GLOBAL, {
    get: () => Object.fromEntries(new URL(location.href).searchParams),
    set: (query: RoutedQuery) => {
      routedQueries.push(query);
      history.pushState(null, '', `${location.pathname}?${toSearchLikeWcl(query)}`);
    },
  });
  return { routedQueries };
}

export function removeFakeQueryRouter(): void {
  Reflect.deleteProperty(window, PAGE_ROUTER_GLOBAL);
}

function toSearchLikeWcl(query: RoutedQuery): string {
  const entries = Object.entries(query).flatMap(([param, value]) =>
    value === null || value === undefined ? [] : [[param, String(value)]],
  );
  return new URLSearchParams(entries).toString();
}

function appendPinsToUrl(pastedPins: string): void {
  const url = new URL(location.href);
  const currentPins = url.searchParams.get(PINS_QUERY_PARAM);
  url.searchParams.set(PINS_QUERY_PARAM, currentPins ? `${currentPins}${PIN_SEPARATOR}${pastedPins}` : pastedPins);
  history.replaceState(null, '', url.href);
}

function requireElement<Element extends HTMLElement = HTMLElement>(selector: string): Element {
  const element = document.querySelector<Element>(selector);
  if (element === null) {
    throw new Error(`Fake WCL page is missing ${selector}`);
  }
  return element;
}
