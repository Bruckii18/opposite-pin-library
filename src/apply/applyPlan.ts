import type { PinString } from '../wcl/pinString';

export const ApplyMode = {
  Add: 'add',
  Replace: 'replace',
} as const;
export type ApplyMode = (typeof ApplyMode)[keyof typeof ApplyMode];

export interface PinApplyPlan {
  readonly activePins: readonly PinString[];
  readonly targetPins: readonly PinString[];
}

export function createApplyPlan(
  activePins: readonly PinString[],
  requestedPins: readonly PinString[],
  mode: ApplyMode,
): PinApplyPlan {
  const uniqueRequestedPins = [...new Set(requestedPins)];
  const targetPins =
    mode === ApplyMode.Add
      ? [...activePins, ...uniqueRequestedPins.filter((pin) => !activePins.includes(pin))]
      : uniqueRequestedPins;
  return { activePins, targetPins };
}

export function isUnchanged(plan: PinApplyPlan): boolean {
  return haveSamePins(plan.activePins, plan.targetPins);
}

export function findAppendedPins(plan: PinApplyPlan): readonly PinString[] | null {
  const keepsActivePinsInPlace = haveSamePins(
    plan.activePins,
    plan.targetPins.slice(0, plan.activePins.length),
  );
  return keepsActivePinsInPlace ? plan.targetPins.slice(plan.activePins.length) : null;
}

export function haveSamePins(first: readonly PinString[], second: readonly PinString[]): boolean {
  return first.length === second.length && first.every((pin, index) => pin === second[index]);
}
