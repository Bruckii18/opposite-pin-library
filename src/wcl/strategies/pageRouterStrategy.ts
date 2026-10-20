import {
  APPLIED,
  ApplyStrategyName,
  notApplied,
  type ApplyStrategy,
} from '../../apply/applyStrategy';
import type { WaitForAppliedPlan } from '../appliedPlanWaiter';
import { RoutePinsStatus } from '../pageBridgeProtocol';
import type { RoutePins } from '../pageRouterClient';
import { toPinsQueryValue } from '../reportUrl';

const PINS_NOT_PICKED_UP = 'The report URL did not pick up the new pins.';
const PINS_AND_VIEW_NOT_PICKED_UP = 'The report URL did not pick up the new pins and view.';

export interface PageRouterStrategyDependencies {
  readonly routePins: RoutePins;
  readonly waitForAppliedPlan: WaitForAppliedPlan;
}

export function createPageRouterStrategy({
  routePins,
  waitForAppliedPlan,
}: PageRouterStrategyDependencies): ApplyStrategy {
  return {
    name: ApplyStrategyName.PageRouter,
    async apply(plan) {
      const response = await routePins(toPinsQueryValue(plan.targetPins), plan.targetView);
      if (response.status !== RoutePinsStatus.Routed) {
        return notApplied(response.detail);
      }
      const isReportShowingPlan = await waitForAppliedPlan(plan);
      if (isReportShowingPlan) {
        return APPLIED;
      }
      return notApplied(plan.targetView === null ? PINS_NOT_PICKED_UP : PINS_AND_VIEW_NOT_PICKED_UP);
    },
  };
}
