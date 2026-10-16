import { createFilterPin, validatePinString, type PinString } from './pinString';
import { PIN_SEPARATOR } from './wclContract';

export const PinInputKind = {
  PinString: 'pin-string',
  FilterExpression: 'filter-expression',
} as const;
export type PinInputKind = (typeof PinInputKind)[keyof typeof PinInputKind];

export type PinInputInterpretation =
  | { readonly valid: true; readonly kind: PinInputKind; readonly pinString: PinString }
  | { readonly valid: false; readonly reason: string };

const EMPTY_INPUT_REASON = 'Paste a pin string or a filter expression.';

export function interpretPinInput(input: string): PinInputInterpretation {
  const trimmedInput = input.trim();
  if (trimmedInput === '') {
    return { valid: false, reason: EMPTY_INPUT_REASON };
  }
  const asPinString = validatePinString(trimmedInput);
  if (asPinString.valid) {
    return { valid: true, kind: PinInputKind.PinString, pinString: asPinString.pinString };
  }
  const asFilterExpression = createFilterPin(trimmedInput);
  if (asFilterExpression.valid) {
    return { valid: true, kind: PinInputKind.FilterExpression, pinString: asFilterExpression.pinString };
  }
  return {
    valid: false,
    reason: trimmedInput.includes(PIN_SEPARATOR)
      ? asPinString.reason
      : `${asPinString.reason} ${asFilterExpression.reason}`,
  };
}
