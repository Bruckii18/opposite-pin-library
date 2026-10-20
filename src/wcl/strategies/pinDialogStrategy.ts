import { findAppendedPins } from '../../apply/applyPlan';
import {
  APPLIED,
  ApplyStrategyName,
  notApplied,
  type ApplyStrategy,
} from '../../apply/applyStrategy';
import type { WaitUntil } from '../../shared/conditionWaiter';
import type { WaitForAppliedPlan } from '../appliedPlanWaiter';
import { locatePinDialog, openFreshPinDialog, submitPastedPins } from '../pinDialog';

export interface PinDialogStrategyDependencies {
  readonly document: Document;
  readonly waitUntil: WaitUntil;
  readonly waitForAppliedPlan: WaitForAppliedPlan;
}

export function createPinDialogStrategy({
  document,
  waitUntil,
  waitForAppliedPlan,
}: PinDialogStrategyDependencies): ApplyStrategy {
  return {
    name: ApplyStrategyName.PinDialog,
    async apply(plan) {
      if (plan.targetView !== null) {
        return notApplied('The Add Pin dialog cannot change the report view.');
      }
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
      const isReportShowingPins = await waitForAppliedPlan(plan);
      return isReportShowingPins ? APPLIED : notApplied('WCL did not add the pasted pins.');
    },
  };
}
