import { describeError } from '../shared/errors';
import {
  createApplyPlan,
  isUnchanged,
  type PinApplyPlan,
  type PinApplyRequest,
  type ReportState,
} from './applyPlan';
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
  readonly isViewChanged: boolean;
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
  readonly readReportState: () => ReportState;
  readonly strategies: readonly ApplyStrategy[];
}

export type ApplyPins = (request: PinApplyRequest) => Promise<ApplyPinsResult>;

export function createApplyPins({ readReportState, strategies }: ApplyPinsDependencies): ApplyPins {
  return async (request) => {
    const plan = createApplyPlan(readReportState(), request);
    const activePinCount = plan.targetPins.length;
    const isViewChanged = plan.targetView !== null;
    if (isUnchanged(plan)) {
      return { outcome: ApplyPinsOutcome.Unchanged, strategy: null, activePinCount, isViewChanged };
    }
    const failures: StrategyFailure[] = [];
    for (const strategy of strategies) {
      const outcome = await attemptStrategy(strategy, plan);
      if (outcome.status !== StrategyOutcomeStatus.NotApplied) {
        return { outcome: outcome.status, strategy: strategy.name, activePinCount, isViewChanged };
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
