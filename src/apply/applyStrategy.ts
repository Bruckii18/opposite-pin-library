import type { PinApplyPlan } from './applyPlan';

export const ApplyStrategyName = {
  PageRouter: 'page-router',
  PinDialog: 'pin-dialog',
  PageReload: 'page-reload',
} as const;
export type ApplyStrategyName = (typeof ApplyStrategyName)[keyof typeof ApplyStrategyName];

export const StrategyOutcomeStatus = {
  Applied: 'applied',
  Reloading: 'reloading',
  NotApplied: 'not-applied',
} as const;

export type StrategyOutcome =
  | { readonly status: typeof StrategyOutcomeStatus.Applied }
  | { readonly status: typeof StrategyOutcomeStatus.Reloading }
  | { readonly status: typeof StrategyOutcomeStatus.NotApplied; readonly reason: string };

export interface ApplyStrategy {
  readonly name: ApplyStrategyName;
  apply(plan: PinApplyPlan): Promise<StrategyOutcome>;
}

export const APPLIED: StrategyOutcome = { status: StrategyOutcomeStatus.Applied };
export const RELOADING: StrategyOutcome = { status: StrategyOutcomeStatus.Reloading };

export function notApplied(reason: string): StrategyOutcome {
  return { status: StrategyOutcomeStatus.NotApplied, reason };
}
