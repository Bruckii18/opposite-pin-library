import {
  APPLIED,
  ApplyStrategyName,
  notApplied,
  type ApplyStrategy,
} from '../../apply/applyStrategy';
import type { WaitForActivePins } from '../activePinsWaiter';
import { RoutePinsStatus } from '../pageBridgeProtocol';
import type { RoutePins } from '../pageRouterClient';
import { toPinsQueryValue } from '../reportUrl';

export interface PageRouterStrategyDependencies {
  readonly routePins: RoutePins;
  readonly waitForActivePins: WaitForActivePins;
}

export function createPageRouterStrategy({
  routePins,
  waitForActivePins,
}: PageRouterStrategyDependencies): ApplyStrategy {
  return {
    name: ApplyStrategyName.PageRouter,
    async apply(plan) {
      const response = await routePins(toPinsQueryValue(plan.targetPins));
      if (response.status !== RoutePinsStatus.Routed) {
        return notApplied(response.detail);
      }
      const isReportShowingPins = await waitForActivePins(plan.targetPins);
      return isReportShowingPins
        ? APPLIED
        : notApplied('The report URL did not pick up the new pins.');
    },
  };
}
