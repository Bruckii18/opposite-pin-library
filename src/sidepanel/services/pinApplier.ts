import type { ApplyMode } from '../../apply/applyPlan';
import type { ApplyPinsResult } from '../../apply/applyPins';
import { createApplyPinsRequest } from '../../messaging/applyPinsMessage';
import type { PinString } from '../../wcl/pinString';
import { ActiveTabStatus, type ActiveReportStore } from './activeReportStore';
import type { SendApplyPinsRequest } from './contentScriptClient';

export interface PinApplier {
  applyPins(pins: readonly PinString[], mode: ApplyMode): Promise<ApplyPinsResult>;
}

export function createPinApplier(
  activeReportStore: ActiveReportStore,
  sendRequest: SendApplyPinsRequest,
): PinApplier {
  return {
    async applyPins(pins, mode) {
      const activeTab = activeReportStore.getSnapshot();
      if (activeTab.status !== ActiveTabStatus.Report) {
        throw new Error('Open a Warcraft Logs report in this window to apply pins.');
      }
      return sendRequest(activeTab.report.tabId, createApplyPinsRequest(pins, mode));
    },
  };
}
