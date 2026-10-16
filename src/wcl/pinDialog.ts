import type { WaitUntil } from '../shared/conditionWaiter';
import { joinPins, type PinString } from './pinString';
import { PIN_DIALOG_SELECTORS } from './wclContract';

export interface PinDialogElements {
  readonly openButton: HTMLElement;
  readonly closeButton: HTMLElement;
  readonly dialog: HTMLElement;
  readonly pasteTab: HTMLElement;
  readonly pasteTextarea: HTMLTextAreaElement;
  readonly createButton: HTMLElement;
}

export type PinDialogLookup =
  | { readonly found: true; readonly elements: PinDialogElements }
  | { readonly found: false; readonly missingSelectors: readonly string[] };

export function locatePinDialog(document: Document): PinDialogLookup {
  const openButton = document.querySelector<HTMLElement>(PIN_DIALOG_SELECTORS.openButton);
  const closeButton = document.querySelector<HTMLElement>(PIN_DIALOG_SELECTORS.closeButton);
  const dialog = document.querySelector<HTMLElement>(PIN_DIALOG_SELECTORS.dialog);
  const pasteTab = document.querySelector<HTMLElement>(PIN_DIALOG_SELECTORS.pasteTab);
  const pasteTextarea = document.querySelector<HTMLTextAreaElement>(PIN_DIALOG_SELECTORS.pasteTextarea);
  const createButton = document.querySelector<HTMLElement>(PIN_DIALOG_SELECTORS.createButton);

  if (openButton && closeButton && dialog && pasteTab && pasteTextarea && createButton) {
    return {
      found: true,
      elements: { openButton, closeButton, dialog, pasteTab, pasteTextarea, createButton },
    };
  }
  return {
    found: false,
    missingSelectors: Object.values(PIN_DIALOG_SELECTORS).filter(
      (selector) => document.querySelector(selector) === null,
    ),
  };
}

export async function openFreshPinDialog(
  elements: PinDialogElements,
  waitUntil: WaitUntil,
): Promise<boolean> {
  if (isDisplayed(elements.dialog)) {
    elements.closeButton.click();
    await waitUntil(() => !isDisplayed(elements.dialog));
  }
  elements.openButton.click();
  return waitUntil(() => isDisplayed(elements.dialog));
}

export function submitPastedPins(elements: PinDialogElements, pins: readonly PinString[]): void {
  elements.pasteTab.click();
  elements.pasteTextarea.value = joinPins(pins);
  elements.pasteTextarea.dispatchEvent(new Event('input', { bubbles: true }));
  elements.createButton.click();
}

function isDisplayed(element: HTMLElement): boolean {
  return element.ownerDocument.defaultView?.getComputedStyle(element).display !== 'none';
}
