import { describeError } from '../shared/errors';
import type { PinString } from '../wcl/pinString';
import { createApplyPlan, isUnchanged, type ApplyMode, type PinApplyPlan } from './applyPlan';
import {
  notApplied,
  StrategyOutcomeStatus,
  type ApplyStrategy,
  type ApplyStrategyName,
  type StrategyOutcome,
} from './applyStrategy';

export const ApplyPinsOutcome = {
  Applied: StrategyOutcomeStatus.Applied,
  Reloading: StrategyOutcomeStatus.Reloading,
  Unchanged: 'unchanged',
} as const;
export type ApplyPinsOutcome = (typeof ApplyPinsOutcome)[keyof typeof ApplyPinsOutcome];

export interface ApplyPinsResult {
  readonly outcome: ApplyPinsOutcome;
  readonly strategy: ApplyStrategyName | null;
  readonly activePinCount: number;
}

export interface StrategyFailure {
  readonly strategy: ApplyStrategyName;
  readonly reason: string;
}

export class ApplyPinsError extends Error {
  constructor(readonly failures: readonly StrategyFailure[]) {
    super(`Could not apply the pins. ${failures.map(formatFailure).join(' ')}`);
    this.name = 'ApplyPinsError';
  }
}

export interface ApplyPinsDependencies {
  readonly readActivePins: () => readonly PinString[];
  readonly strategies: readonly ApplyStrategy[];
}

export type ApplyPins = (
  pinStrings: readonly PinString[],
  mode: ApplyMode,
) => Promise<ApplyPinsResult>;

export function createApplyPins({ readActivePins, strategies }: ApplyPinsDependencies): ApplyPins {
  return async (pinStrings, mode) => {
    const plan = createApplyPlan(readActivePins(), pinStrings, mode);
    const activePinCount = plan.targetPins.length;
    if (isUnchanged(plan)) {
      return { outcome: ApplyPinsOutcome.Unchanged, strategy: null, activePinCount };
    }
    const failures: StrategyFailure[] = [];
    for (const strategy of strategies) {
      const outcome = await attemptStrategy(strategy, plan);
      if (outcome.status !== StrategyOutcomeStatus.NotApplied) {
        return { outcome: outcome.status, strategy: strategy.name, activePinCount };
      }
      failures.push({ strategy: strategy.name, reason: outcome.reason });
    }
    throw new ApplyPinsError(failures);
  };
}

async function attemptStrategy(
  strategy: ApplyStrategy,
  plan: PinApplyPlan,
): Promise<StrategyOutcome> {
  try {
    return await strategy.apply(plan);
  } catch (error) {
    return notApplied(describeError(error));
  }
}

function formatFailure({ strategy, reason }: StrategyFailure): string {
  return `[${strategy}] ${reason}`;
}
