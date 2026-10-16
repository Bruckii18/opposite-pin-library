import { describe, expect, it } from 'vitest';
import { CAST_FILTER, DEATH_BADGE, MOONFIRE_DECORATOR } from '../test/pinFixtures';
import { ApplyMode, createApplyPlan, findAppendedPins, isUnchanged } from './applyPlan';

describe('createApplyPlan', () => {
  it('appends requested pins after the active ones in add mode', () => {
    const plan = createApplyPlan([MOONFIRE_DECORATOR], [DEATH_BADGE, CAST_FILTER], ApplyMode.Add);

    expect(plan.targetPins).toEqual([MOONFIRE_DECORATOR, DEATH_BADGE, CAST_FILTER]);
    expect(findAppendedPins(plan)).toEqual([DEATH_BADGE, CAST_FILTER]);
  });

  it('does not add a pin that is already active', () => {
    const plan = createApplyPlan([MOONFIRE_DECORATOR], [MOONFIRE_DECORATOR, DEATH_BADGE], ApplyMode.Add);

    expect(plan.targetPins).toEqual([MOONFIRE_DECORATOR, DEATH_BADGE]);
  });

  it('uses only the requested pins in replace mode', () => {
    const plan = createApplyPlan([MOONFIRE_DECORATOR], [DEATH_BADGE, DEATH_BADGE], ApplyMode.Replace);

    expect(plan.targetPins).toEqual([DEATH_BADGE]);
    expect(findAppendedPins(plan)).toBeNull();
  });

  it('treats replacing with a superset as an append', () => {
    const plan = createApplyPlan([MOONFIRE_DECORATOR], [MOONFIRE_DECORATOR, CAST_FILTER], ApplyMode.Replace);

    expect(findAppendedPins(plan)).toEqual([CAST_FILTER]);
  });

  it('recognizes when nothing would change', () => {
    expect(isUnchanged(createApplyPlan([DEATH_BADGE], [DEATH_BADGE], ApplyMode.Add))).toBe(true);
    expect(isUnchanged(createApplyPlan([DEATH_BADGE], [DEATH_BADGE], ApplyMode.Replace))).toBe(true);
    expect(isUnchanged(createApplyPlan([DEATH_BADGE], [CAST_FILTER], ApplyMode.Replace))).toBe(false);
  });
});
