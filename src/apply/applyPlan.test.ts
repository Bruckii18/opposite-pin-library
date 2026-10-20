import { describe, expect, it } from 'vitest';
import { CAST_FILTER, DEATH_BADGE, MOONFIRE_DECORATOR } from '../test/pinFixtures';
import type { PinString } from '../wcl/pinString';
import type { ViewParams, ViewQuery } from '../wcl/viewParams';
import { ApplyMode, createApplyPlan, findAppendedPins, isUnchanged } from './applyPlan';

const DAMAGE_TAKEN_EVENTS: ViewParams = { tab: 'damage-taken', ability: '1304424', view: 'events' };
const DAMAGE_TAKEN_EVENTS_QUERY: ViewQuery = { type: 'damage-taken', ability: '1304424', view: 'events' };
const CASTS_TABLE: ViewParams = { tab: 'casts' };

function planPins(activePins: readonly PinString[], requestedPins: readonly PinString[], mode: ApplyMode) {
  return createApplyPlan({ pins: activePins, viewQuery: {} }, { pins: requestedPins, mode, view: null });
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
      { pins: [MOONFIRE_DECORATOR], viewQuery: DAMAGE_TAKEN_EVENTS_QUERY },
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
      { pins: [], viewQuery: DAMAGE_TAKEN_EVENTS_QUERY },
      { pins: [DEATH_BADGE], mode: ApplyMode.Add, view: CASTS_TABLE },
    );

    expect(plan.targetView).toEqual(CASTS_TABLE);
  });

  it('treats a saved default view as a change when the report shows another view', () => {
    const plan = createApplyPlan(
      { pins: [], viewQuery: DAMAGE_TAKEN_EVENTS_QUERY },
      { pins: [DEATH_BADGE], mode: ApplyMode.Add, view: {} },
    );

    expect(plan.targetView).toEqual({});
  });

  it('applies a view change even when the pins are already active', () => {
    const plan = createApplyPlan(
      { pins: [DEATH_BADGE], viewQuery: { type: 'casts' } },
      { pins: [DEATH_BADGE], mode: ApplyMode.Add, view: DAMAGE_TAKEN_EVENTS },
    );

    expect(isUnchanged(plan)).toBe(false);
    expect(plan.targetView).toEqual(DAMAGE_TAKEN_EVENTS);
  });

  it('leaves the view alone when the report already shows the saved view', () => {
    const plan = createApplyPlan(
      { pins: [DEATH_BADGE], viewQuery: DAMAGE_TAKEN_EVENTS_QUERY },
      { pins: [DEATH_BADGE], mode: ApplyMode.Add, view: DAMAGE_TAKEN_EVENTS },
    );

    expect(plan.targetView).toBeNull();
    expect(isUnchanged(plan)).toBe(true);
  });

  it('tells Buffs and Debuffs apart although both are type=auras', () => {
    const plan = createApplyPlan(
      { pins: [DEATH_BADGE], viewQuery: { type: 'auras', spells: 'debuffs' } },
      { pins: [DEATH_BADGE], mode: ApplyMode.Add, view: { tab: 'buffs' } },
    );

    expect(plan.targetView).toEqual({ tab: 'buffs' });
  });

  it('repairs a legacy type=debuffs URL instead of treating it as the Debuffs tab', () => {
    const plan = createApplyPlan(
      { pins: [DEATH_BADGE], viewQuery: { type: 'debuffs' } },
      { pins: [DEATH_BADGE], mode: ApplyMode.Add, view: { tab: 'debuffs' } },
    );

    expect(plan.targetView).toEqual({ tab: 'debuffs' });
  });
});
