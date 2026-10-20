import { ApplyMode } from '../apply/applyPlan';
import type { ApplyPinsResult } from '../apply/applyPins';
import type { PinString } from '../wcl/pinString';
import { isViewParams, type ViewParams } from '../wcl/viewParams';

export const APPLY_PINS_MESSAGE_TYPE = 'opposite-pin-library/apply-pins';

export interface ApplyPinsRequest {
  readonly type: typeof APPLY_PINS_MESSAGE_TYPE;
  readonly pinStrings: readonly string[];
  readonly mode: ApplyMode;
  readonly viewParams: ViewParams | null;
}

export type ApplyPinsResponse =
  | { readonly ok: true; readonly result: ApplyPinsResult }
  | { readonly ok: false; readonly errorMessage: string };

const APPLY_MODES: ReadonlySet<unknown> = new Set(Object.values(ApplyMode));

export function createApplyPinsRequest(
  pins: readonly PinString[],
  mode: ApplyMode,
  viewParams: ViewParams | null,
): ApplyPinsRequest {
  return { type: APPLY_PINS_MESSAGE_TYPE, pinStrings: pins, mode, viewParams };
}

export function isApplyPinsRequest(message: unknown): message is ApplyPinsRequest {
  if (typeof message !== 'object' || message === null) {
    return false;
  }
  const candidate = message as Partial<Record<keyof ApplyPinsRequest, unknown>>;
  return (
    candidate.type === APPLY_PINS_MESSAGE_TYPE &&
    APPLY_MODES.has(candidate.mode) &&
    Array.isArray(candidate.pinStrings) &&
    candidate.pinStrings.every((pinString) => typeof pinString === 'string') &&
    (candidate.viewParams === null || isViewParams(candidate.viewParams))
  );
}
