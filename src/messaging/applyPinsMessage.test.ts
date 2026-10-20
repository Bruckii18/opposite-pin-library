import { describe, expect, it } from 'vitest';
import { ApplyMode } from '../apply/applyPlan';
import { DEATH_BADGE } from '../test/pinFixtures';
import { APPLY_PINS_MESSAGE_TYPE, createApplyPinsRequest, isApplyPinsRequest } from './applyPinsMessage';

describe('isApplyPinsRequest', () => {
  it('accepts requests created by the side panel', () => {
    expect(isApplyPinsRequest(createApplyPinsRequest([DEATH_BADGE], ApplyMode.Replace, null))).toBe(true);
    expect(
      isApplyPinsRequest(createApplyPinsRequest([DEATH_BADGE], ApplyMode.Add, { type: 'casts', ability: '1' })),
    ).toBe(true);
  });

  it.each([
    null,
    'apply',
    { type: 'something-else', pinStrings: [], mode: ApplyMode.Add, viewParams: null },
    { type: APPLY_PINS_MESSAGE_TYPE, pinStrings: [1], mode: ApplyMode.Add, viewParams: null },
    { type: APPLY_PINS_MESSAGE_TYPE, pinStrings: [], mode: 'merge', viewParams: null },
    { type: APPLY_PINS_MESSAGE_TYPE, pinStrings: [], mode: ApplyMode.Add },
    { type: APPLY_PINS_MESSAGE_TYPE, pinStrings: [], mode: ApplyMode.Add, viewParams: { fight: '3' } },
    { type: APPLY_PINS_MESSAGE_TYPE, pinStrings: [], mode: ApplyMode.Add, viewParams: { ability: 1304424 } },
  ])('rejects %j', (message) => {
    expect(isApplyPinsRequest(message)).toBe(false);
  });
});
