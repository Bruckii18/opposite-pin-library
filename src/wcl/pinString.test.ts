import { describe, expect, it } from 'vitest';
import {
  CAST_FILTER,
  DAMAGE_SUMMARY,
  DEATH_BADGE,
  HEALING_WEIGHT,
  MOONFIRE_DECORATOR,
  SCRIPT_DECORATOR,
} from '../test/pinFixtures';
import {
  describePin,
  InvalidPinStringError,
  joinPins,
  PinKind,
  requirePinString,
  splitPins,
  validatePinString,
} from './pinString';

describe('validatePinString', () => {
  it('accepts a pin string copied from WCL and trims surrounding whitespace', () => {
    const validation = validatePinString(`  ${DEATH_BADGE}\n`);

    expect(validation).toEqual({ valid: true, pinString: DEATH_BADGE });
  });

  it.each([
    ['an empty string', '   ', 'empty'],
    ['several joined pins', `${DEATH_BADGE}^${CAST_FILTER}`, 'several pins'],
    ['plain text', 'Moonfire uptime', 'does not look like'],
    ['a non-numeric pin type', 'x$Off$#000000$expression$type = "cast"', 'does not look like'],
  ])('rejects %s', (_description, input, expectedReason) => {
    const validation = validatePinString(input);

    expect(validation.valid).toBe(false);
    expect(validation.valid ? '' : validation.reason).toContain(expectedReason);
  });

  it('throws a typed error from requirePinString for invalid input', () => {
    expect(() => requirePinString('not a pin')).toThrow(InvalidPinStringError);
  });
});

describe('splitPins and joinPins', () => {
  it('round-trips several pins through the WCL separator', () => {
    const joined = joinPins([MOONFIRE_DECORATOR, DEATH_BADGE]);

    expect(joined).toBe(`${MOONFIRE_DECORATOR}^${DEATH_BADGE}`);
    expect(splitPins(joined)).toEqual([MOONFIRE_DECORATOR, DEATH_BADGE]);
  });

  it('skips fragments that are not pins', () => {
    expect(splitPins(`${DEATH_BADGE}^^garbage`)).toEqual([DEATH_BADGE]);
  });
});

describe('describePin', () => {
  it.each([
    [MOONFIRE_DECORATOR, PinKind.Decorator, '#244F4B', 'ability.name = "Moonfire"'],
    [DEATH_BADGE, PinKind.Badge, '#A33C3C', 'type = "death"'],
    [CAST_FILTER, PinKind.Filter, '#3C7AA3', 'type = "cast"'],
    [DAMAGE_SUMMARY, PinKind.Summary, '#909049', 'Query on damage events'],
    [HEALING_WEIGHT, PinKind.DpsWeight, '#4060A0', 'type = "heal"'],
    [SCRIPT_DECORATOR, PinKind.Decorator, '#112233', 'Custom script'],
  ])('describes %s', (pin, kind, color, summary) => {
    expect(describePin(pin)).toEqual({ kind, color, summary });
  });

  it('reports unknown pin types instead of failing', () => {
    const futurePin = requirePinString('9$Off$#000000$expression$type = "cast"');

    expect(describePin(futurePin).kind).toBe(PinKind.Unknown);
  });
});
