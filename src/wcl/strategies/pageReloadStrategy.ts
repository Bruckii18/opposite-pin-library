import type { PinApplyPlan } from '../../apply/applyPlan';
import { ApplyStrategyName, RELOADING, type ApplyStrategy } from '../../apply/applyStrategy';
import { withPins, withViewParams } from '../reportUrl';

export interface PageReloadStrategyDependencies {
  readonly readCurrentUrl: () => string;
  readonly navigate: (url: string) => void;
}

export function createPageReloadStrategy({
  readCurrentUrl,
  navigate,
}: PageReloadStrategyDependencies): ApplyStrategy {
  return {
    name: ApplyStrategyName.PageReload,
    async apply(plan) {
      navigate(toPlannedUrl(new URL(readCurrentUrl()), plan).href);
      return RELOADING;
    },
  };
}

function toPlannedUrl(currentUrl: URL, plan: PinApplyPlan): URL {
  const urlWithPins = withPins(currentUrl, plan.targetPins);
  return plan.targetView === null ? urlWithPins : withViewParams(urlWithPins, plan.targetView);
}
