import { PIN_FIELD_SEPARATOR, PIN_SEPARATOR } from './wclContract';

declare const pinStringBrand: unique symbol;
export type PinString = string & { readonly [pinStringBrand]: true };

export const PinKind = {
  Decorator: 'Decorator',
  Badge: 'Badge',
  Filter: 'Filter',
  Summary: 'Summary',
  DpsWeight: 'DPS Weight',
  Unknown: 'Unknown',
} as const;
export type PinKind = (typeof PinKind)[keyof typeof PinKind];

export interface PinDescription {
  readonly kind: PinKind;
  readonly color: string | null;
  readonly summary: string;
}

export type PinStringValidation =
  | { readonly valid: true; readonly pinString: PinString }
  | { readonly valid: false; readonly reason: string };

export class InvalidPinStringError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = 'InvalidPinStringError';
  }
}

// Ordered like the "Pin Type" select in WCL's Add Pin dialog; the index is the type code in the string.
const PIN_KINDS_BY_CODE: readonly PinKind[] = [
  PinKind.Decorator,
  PinKind.Badge,
  PinKind.Filter,
  PinKind.Summary,
  PinKind.DpsWeight,
];

const EXTRA_FIELD_COUNT_BY_KIND: Partial<Record<PinKind, number>> = {
  [PinKind.Summary]: 2,
  [PinKind.DpsWeight]: 1,
};

const COLOR_FIELD_INDEX = 2;
const MINIMUM_FIELD_COUNT = 4;
const EXPRESSION_COMPONENT = 'expression';
const SCRIPT_COMPONENT = 'script';
const NEW_PIN_GRAPH = 'Off';
const NEW_PIN_COLOR = '#244F4B';
const INTEGER_PATTERN = /^\d+$/;
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

export function validatePinString(raw: string): PinStringValidation {
  const candidate = raw.trim();
  if (candidate === '') {
    return { valid: false, reason: 'The pin string is empty.' };
  }
  if (candidate.includes(PIN_SEPARATOR)) {
    return {
      valid: false,
      reason: `This contains several pins joined by "${PIN_SEPARATOR}". Paste one pin at a time.`,
    };
  }
  const fields = candidate.split(PIN_FIELD_SEPARATOR);
  if (fields.length < MINIMUM_FIELD_COUNT || !INTEGER_PATTERN.test(fields[0] ?? '')) {
    return { valid: false, reason: 'This does not look like a Warcraft Logs pin string.' };
  }
  return { valid: true, pinString: candidate as PinString };
}

export function createFilterPin(expression: string): PinStringValidation {
  const trimmedExpression = expression.trim();
  if (trimmedExpression === '') {
    return { valid: false, reason: 'The filter expression is empty.' };
  }
  if (trimmedExpression.includes(PIN_FIELD_SEPARATOR) || trimmedExpression.includes(PIN_SEPARATOR)) {
    return {
      valid: false,
      reason: `Filter expressions cannot contain "${PIN_FIELD_SEPARATOR}" or "${PIN_SEPARATOR}".`,
    };
  }
  return validatePinString(
    [codeOfPinKind(PinKind.Filter), NEW_PIN_GRAPH, NEW_PIN_COLOR, EXPRESSION_COMPONENT, trimmedExpression].join(
      PIN_FIELD_SEPARATOR,
    ),
  );
}

export function requirePinString(raw: string): PinString {
  const validation = validatePinString(raw);
  if (!validation.valid) {
    throw new InvalidPinStringError(validation.reason);
  }
  return validation.pinString;
}

export function splitPins(joinedPins: string): PinString[] {
  return joinedPins
    .split(PIN_SEPARATOR)
    .map(validatePinString)
    .filter((validation) => validation.valid)
    .map((validation) => validation.pinString);
}

export function joinPins(pins: readonly PinString[]): string {
  return pins.join(PIN_SEPARATOR);
}

export function describePin(pin: PinString): PinDescription {
  const fields = pin.split(PIN_FIELD_SEPARATOR);
  const kind = pinKindOfCode(fields[0]);
  const colorIndex = COLOR_FIELD_INDEX + (EXTRA_FIELD_COUNT_BY_KIND[kind] ?? 0);
  return {
    kind,
    color: toHexColor(fields[colorIndex]),
    summary: summarizeFirstComponent(fields.slice(colorIndex + 1)),
  };
}

function pinKindOfCode(code: string | undefined): PinKind {
  return code !== undefined && INTEGER_PATTERN.test(code)
    ? (PIN_KINDS_BY_CODE[Number(code)] ?? PinKind.Unknown)
    : PinKind.Unknown;
}

function codeOfPinKind(kind: PinKind): string {
  return String(PIN_KINDS_BY_CODE.indexOf(kind));
}

function toHexColor(field: string | undefined): string | null {
  return field !== undefined && HEX_COLOR_PATTERN.test(field) ? field : null;
}

function summarizeFirstComponent([componentType, firstValue]: readonly string[]): string {
  if (componentType === EXPRESSION_COMPONENT) {
    return firstValue ?? '';
  }
  if (componentType === SCRIPT_COMPONENT) {
    return 'Custom script';
  }
  return `Query on ${componentType || 'any'} events`;
}
