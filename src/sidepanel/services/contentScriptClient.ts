import type { ApplyPinsResult } from '../../apply/applyPins';
import type { ApplyPinsRequest, ApplyPinsResponse } from '../../messaging/applyPinsMessage';

export class ContentScriptUnavailableError extends Error {
  constructor(options?: ErrorOptions) {
    super(
      'The extension cannot reach this tab yet. Reload the Warcraft Logs tab once and try again.',
      options,
    );
    this.name = 'ContentScriptUnavailableError';
  }
}

export type SendApplyPinsRequest = (
  tabId: number,
  request: ApplyPinsRequest,
) => Promise<ApplyPinsResult>;

export const sendApplyPinsRequest: SendApplyPinsRequest = async (tabId, request) => {
  const response = await deliverToContentScript(tabId, request);
  if (!response.ok) {
    throw new Error(response.errorMessage);
  }
  return response.result;
};

async function deliverToContentScript(
  tabId: number,
  request: ApplyPinsRequest,
): Promise<ApplyPinsResponse> {
  const response = await chrome.tabs
    .sendMessage<ApplyPinsRequest, ApplyPinsResponse | undefined>(tabId, request)
    .catch((error: unknown) => {
      throw new ContentScriptUnavailableError({ cause: error });
    });
  if (response === undefined) {
    throw new ContentScriptUnavailableError();
  }
  return response;
}
