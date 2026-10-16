import { createApplyPins } from '../apply/applyPins';
import {
  isApplyPinsRequest,
  type ApplyPinsRequest,
  type ApplyPinsResponse,
} from '../messaging/applyPinsMessage';
import { createConditionWaiter } from '../shared/conditionWaiter';
import { describeError } from '../shared/errors';
import { createActivePinsWaiter } from '../wcl/activePinsWaiter';
import { createPageRouterClient } from '../wcl/pageRouterClient';
import { requirePinString } from '../wcl/pinString';
import { isWclReportUrl, readActivePins } from '../wcl/reportUrl';
import { createPageReloadStrategy } from '../wcl/strategies/pageReloadStrategy';
import { createPageRouterStrategy } from '../wcl/strategies/pageRouterStrategy';
import { createPinDialogStrategy } from '../wcl/strategies/pinDialogStrategy';

const PAGE_BRIDGE_TIMEOUT_MS = 1_000;
const PAGE_UPDATE_TIMEOUT_MS = 3_000;
const PAGE_POLL_INTERVAL_MS = 50;

const readCurrentUrl = (): string => window.location.href;
const waitUntil = createConditionWaiter({
  timeoutMs: PAGE_UPDATE_TIMEOUT_MS,
  intervalMs: PAGE_POLL_INTERVAL_MS,
});
const waitForActivePins = createActivePinsWaiter({ readCurrentUrl, waitUntil });

const applyPins = createApplyPins({
  readActivePins: () => readActivePins(new URL(readCurrentUrl())),
  strategies: [
    createPageRouterStrategy({
      routePins: createPageRouterClient(window, PAGE_BRIDGE_TIMEOUT_MS),
      waitForActivePins,
    }),
    createPinDialogStrategy({ document, waitUntil, waitForActivePins }),
    createPageReloadStrategy({ readCurrentUrl, navigate: navigateAfterResponding }),
  ],
});

chrome.runtime.onMessage.addListener(
  (message: unknown, _sender, sendResponse: (response: ApplyPinsResponse) => void) => {
    if (!isApplyPinsRequest(message)) {
      return false;
    }
    void handleApplyPinsRequest(message).then(sendResponse);
    return true;
  },
);

async function handleApplyPinsRequest(request: ApplyPinsRequest): Promise<ApplyPinsResponse> {
  try {
    if (!isWclReportUrl(new URL(readCurrentUrl()))) {
      return { ok: false, errorMessage: 'This tab is not showing a Warcraft Logs report.' };
    }
    const result = await applyPins(request.pinStrings.map(requirePinString), request.mode);
    return { ok: true, result };
  } catch (error) {
    return { ok: false, errorMessage: describeError(error) };
  }
}

function navigateAfterResponding(url: string): void {
  setTimeout(() => window.location.assign(url));
}
