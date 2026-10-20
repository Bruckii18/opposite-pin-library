import { describe, expect, it } from 'vitest';
import { CAST_FILTER, DEATH_BADGE, MOONFIRE_DECORATOR } from '../test/pinFixtures';
import type { PinString } from '../wcl/pinString';
import type { ViewParams } from '../wcl/viewParams';
import { ApplyMode, createApplyPlan, findAppendedPins, isUnchanged } from './applyPlan';

const DAMAGE_TAKEN_EVENTS: ViewParams = { type: 'damage-taken', ability: '1304424', view: 'events' };
const CASTS_TABLE: ViewParams = { type: 'casts' };

function planPins(activePins: readonly PinString[], requestedPins: readonly PinString[], mode: ApplyMode) {
  return createApplyPlan({ pins: activePins, view: {} }, { pins: requestedPins, mode, view: null });
}

describe('createApplyPlan', () => {
  it('appends requested pins after the active ones in add mode', () => {
    const plan = planPins([MOONFIRE_DECORATOR], [DEATH_BADGE, CAST_FILTER], ApplyMode.Add);

    expect(plan.targetPins).toEqual([MOONFIRE_DECORATOR, DEATH_BADGE, CAST_FILTER]);
    expect(findAppendedPins(plan)).toEqual([DEATH_BADGE, CAST_FILTER]);
  });

  it('does not add a pin that is already active', () => {
    const plan = planPins([MOONFIRE_DECORATOR], [MOONFIRE_DECORATOR, DEATH_BADGE], ApplyMode.Add);

    expect(plan.targetPins).toEqual([MOONFIRE_DECORATOR, DEATH_BADGE]);
  });

  it('uses only the requested pins in replace mode', () => {
    const plan = planPins([MOONFIRE_DECORATOR], [DEATH_BADGE, DEATH_BADGE], ApplyMode.Replace);

    expect(plan.targetPins).toEqual([DEATH_BADGE]);
    expect(findAppendedPins(plan)).toBeNull();
  });

  it('treats replacing with a superset as an append', () => {
    const plan = planPins([MOONFIRE_DECORATOR], [MOONFIRE_DECORATOR, CAST_FILTER], ApplyMode.Replace);

    expect(findAppendedPins(plan)).toEqual([CAST_FILTER]);
  });

  it('recognizes when nothing would change', () => {
    expect(isUnchanged(planPins([DEATH_BADGE], [DEATH_BADGE], ApplyMode.Add))).toBe(true);
    expect(isUnchanged(planPins([DEATH_BADGE], [DEATH_BADGE], ApplyMode.Replace))).toBe(true);
    expect(isUnchanged(planPins([DEATH_BADGE], [CAST_FILTER], ApplyMode.Replace))).toBe(false);
  });
});

describe('createApplyPlan with a saved view', () => {
  it('keeps the current view when the request has no saved view', () => {
    const plan = createApplyPlan(
      { pins: [MOONFIRE_DECORATOR], view: DAMAGE_TAKEN_EVENTS },
      { pins: [DEATH_BADGE], mode: ApplyMode.Add, view: null },
    );

    expect(plan).toEqual({
      activePins: [MOONFIRE_DECORATOR],
      targetPins: [MOONFIRE_DECORATOR, DEATH_BADGE],
      targetView: null,
    });
  });

  it('targets the saved view when it differs from the current one', () => {
    const plan = createApplyPlan(
      { pins: [], view: DAMAGE_TAKEN_EVENTS },
      { pins: [DEATH_BADGE], mode: ApplyMode.Add, view: CASTS_TABLE },
    );

    expect(plan.targetView).toEqual(CASTS_TABLE);
  });

  it('treats a saved default view as a change when the report shows another view', () => {
    const plan = createApplyPlan(
      { pins: [], view: DAMAGE_TAKEN_EVENTS },
      { pins: [DEATH_BADGE], mode: ApplyMode.Add, view: {} },
    );

    expect(plan.targetView).toEqual({});
  });

  it('applies a view change even when the pins are already active', () => {
    const plan = createApplyPlan(
      { pins: [DEATH_BADGE], view: CASTS_TABLE },
      { pins: [DEATH_BADGE], mode: ApplyMode.Add, view: DAMAGE_TAKEN_EVENTS },
    );

    expect(isUnchanged(plan)).toBe(false);
    expect(plan.targetView).toEqual(DAMAGE_TAKEN_EVENTS);
  });

  it('leaves the view alone when the report already shows the saved view', () => {
    const plan = createApplyPlan(
      { pins: [DEATH_BADGE], view: { ...DAMAGE_TAKEN_EVENTS } },
      { pins: [DEATH_BADGE], mode: ApplyMode.Add, view: DAMAGE_TAKEN_EVENTS },
    );

    expect(plan.targetView).toBeNull();
    expect(isUnchanged(plan)).toBe(true);
  });
});
