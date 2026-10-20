import { haveSamePins, type PinApplyPlan } from '../apply/applyPlan';
import type { WaitUntil } from '../shared/conditionWaiter';
import { readActivePins, readViewParams } from './reportUrl';
import { haveSameViewParams } from './viewParams';

export type WaitForAppliedPlan = (plan: PinApplyPlan) => Promise<boolean>;

export interface AppliedPlanWaiterDependencies {
  readonly readCurrentUrl: () => string;
  readonly waitUntil: WaitUntil;
}

export function createAppliedPlanWaiter({
  readCurrentUrl,
  waitUntil,
}: AppliedPlanWaiterDependencies): WaitForAppliedPlan {
  return (plan) => waitUntil(() => isShowingPlan(new URL(readCurrentUrl()), plan));
}

function isShowingPlan(reportUrl: URL, plan: PinApplyPlan): boolean {
  return (
    haveSamePins(readActivePins(reportUrl), plan.targetPins) &&
    (plan.targetView === null || haveSameViewParams(readViewParams(reportUrl), plan.targetView))
  );
}
