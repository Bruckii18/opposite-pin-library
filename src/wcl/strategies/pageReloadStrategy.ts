import { ApplyStrategyName, RELOADING, type ApplyStrategy } from '../../apply/applyStrategy';
import { withPins } from '../reportUrl';

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
      navigate(withPins(new URL(readCurrentUrl()), plan.targetPins).href);
      return RELOADING;
    },
  };
}
