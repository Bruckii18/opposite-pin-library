import { findAppendedPins } from '../../apply/applyPlan';
import {
  APPLIED,
  ApplyStrategyName,
  notApplied,
  type ApplyStrategy,
} from '../../apply/applyStrategy';
import type { WaitUntil } from '../../shared/conditionWaiter';
import type { WaitForActivePins } from '../activePinsWaiter';
import { locatePinDialog, openFreshPinDialog, submitPastedPins } from '../pinDialog';

export interface PinDialogStrategyDependencies {
  readonly document: Document;
  readonly waitUntil: WaitUntil;
  readonly waitForActivePins: WaitForActivePins;
}

export function createPinDialogStrategy({
  document,
  waitUntil,
  waitForActivePins,
}: PinDialogStrategyDependencies): ApplyStrategy {
  return {
    name: ApplyStrategyName.PinDialog,
    async apply(plan) {
      const appendedPins = findAppendedPins(plan);
      if (appendedPins === null) {
        return notApplied('The Add Pin dialog can only add pins, not remove active ones.');
      }
      const lookup = locatePinDialog(document);
      if (!lookup.found) {
        return notApplied(`Add Pin dialog elements not found: ${lookup.missingSelectors.join(', ')}.`);
      }
      const isDialogOpen = await openFreshPinDialog(lookup.elements, waitUntil);
      if (!isDialogOpen) {
        return notApplied('The Add Pin dialog did not open.');
      }
      submitPastedPins(lookup.elements, appendedPins);
      const isReportShowingPins = await waitForActivePins(plan.targetPins);
      return isReportShowingPins ? APPLIED : notApplied('WCL did not add the pasted pins.');
    },
  };
}
