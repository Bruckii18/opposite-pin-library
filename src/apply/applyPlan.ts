import type { PinString } from '../wcl/pinString';
import { haveSameViewParams, type ViewParams } from '../wcl/viewParams';

export const ApplyMode = {
  Add: 'add',
  Replace: 'replace',
} as const;
export type ApplyMode = (typeof ApplyMode)[keyof typeof ApplyMode];

export interface ReportState {
  readonly pins: readonly PinString[];
  readonly view: ViewParams;
}

export interface PinApplyRequest {
  readonly pins: readonly PinString[];
  readonly mode: ApplyMode;
  readonly view: ViewParams | null;
}

export interface PinApplyPlan {
  readonly activePins: readonly PinString[];
  readonly targetPins: readonly PinString[];
  readonly targetView: ViewParams | null;
}

export function createApplyPlan(report: ReportState, request: PinApplyRequest): PinApplyPlan {
  return {
    activePins: report.pins,
    targetPins: planTargetPins(report.pins, request.pins, request.mode),
    targetView: planTargetView(report.view, request.view),
  };
}

export function isUnchanged(plan: PinApplyPlan): boolean {
  return plan.targetView === null && haveSamePins(plan.activePins, plan.targetPins);
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

function planTargetPins(
  activePins: readonly PinString[],
  requestedPins: readonly PinString[],
  mode: ApplyMode,
): readonly PinString[] {
  const uniqueRequestedPins = [...new Set(requestedPins)];
  return mode === ApplyMode.Add
    ? [...activePins, ...uniqueRequestedPins.filter((pin) => !activePins.includes(pin))]
    : uniqueRequestedPins;
}

function planTargetView(activeView: ViewParams, requestedView: ViewParams | null): ViewParams | null {
  return requestedView === null || haveSameViewParams(activeView, requestedView) ? null : requestedView;
}
