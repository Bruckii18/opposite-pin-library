import { describe, expect, it } from 'vitest';
import { CAST_FILTER, DEATH_BADGE } from '../test/pinFixtures';
import { interpretPinInput, PinInputKind } from './pinInput';
import { describePin, PinKind } from './pinString';

describe('interpretPinInput', () => {
  it('keeps a full pin string as it is', () => {
    expect(interpretPinInput(` ${DEATH_BADGE} `)).toEqual({
      valid: true,
      kind: PinInputKind.PinString,
      pinString: DEATH_BADGE,
    });
  });

  it('turns a bare expression into the same Filter pin WCL creates from its Filter Expression box', () => {
    const interpretation = interpretPinInput('  ability.name = "Moonfire" and target.name = "Boss"  ');

    expect(interpretation).toEqual({
      valid: true,
      kind: PinInputKind.FilterExpression,
      pinString: '2$Off$#244F4B$expression$ability.name = "Moonfire" and target.name = "Boss"',
    });
    expect(interpretation.valid && describePin(interpretation.pinString).kind).toBe(PinKind.Filter);
  });

  it.each([
    ['empty input', '   ', 'Paste a pin string or a filter expression.'],
    ['several joined pins', `${DEATH_BADGE}^${CAST_FILTER}`, 'several pins joined by "^"'],
    ['a broken pin string', '2$Off$type = "cast"', 'Filter expressions cannot contain "$" or "^".'],
  ])('rejects %s', (_description, input, expectedReason) => {
    const interpretation = interpretPinInput(input);

    expect(interpretation.valid).toBe(false);
    expect(interpretation.valid ? '' : interpretation.reason).toContain(expectedReason);
  });
});
