import { describe, expect, it, vi } from 'vitest';
import { CAST_FILTER, DEATH_BADGE, MOONFIRE_DECORATOR } from '../test/pinFixtures';
import type { PinString } from '../wcl/pinString';
import type { ViewParams } from '../wcl/viewParams';
import { ApplyMode, type PinApplyPlan } from './applyPlan';
import { ApplyPinsError, ApplyPinsOutcome, createApplyPins } from './applyPins';
import {
  APPLIED,
  ApplyStrategyName,
  notApplied,
  RELOADING,
  type ApplyStrategy,
  type StrategyOutcome,
} from './applyStrategy';

const DAMAGE_TAKEN_EVENTS: ViewParams = { type: 'damage-taken', ability: '1304424', view: 'events' };

function fakeStrategy(
  name: ApplyStrategy['name'],
  apply: (plan: PinApplyPlan) => Promise<StrategyOutcome>,
): ApplyStrategy {
  return { name, apply: vi.fn(apply) };
}

function applyPinsWith(
  activePins: readonly PinString[],
  strategies: readonly ApplyStrategy[],
  activeView: ViewParams = {},
) {
  return createApplyPins({ readReportState: () => ({ pins: activePins, view: activeView }), strategies });
}

describe('createApplyPins', () => {
  it('uses the first strategy that applies the pins', async () => {
    const router = fakeStrategy(ApplyStrategyName.PageRouter, async () => APPLIED);
    const dialog = fakeStrategy(ApplyStrategyName.PinDialog, async () => APPLIED);

    const result = await applyPinsWith([MOONFIRE_DECORATOR], [router, dialog])({
      pins: [DEATH_BADGE],
      mode: ApplyMode.Add,
      view: null,
    });

    expect(result).toEqual({
      outcome: ApplyPinsOutcome.Applied,
      strategy: ApplyStrategyName.PageRouter,
      activePinCount: 2,
      isViewChanged: false,
    });
    expect(router.apply).toHaveBeenCalledWith({
      activePins: [MOONFIRE_DECORATOR],
      targetPins: [MOONFIRE_DECORATOR, DEATH_BADGE],
      targetView: null,
    });
    expect(dialog.apply).not.toHaveBeenCalled();
  });

  it('falls back to the next strategy when one cannot apply or throws', async () => {
    const router = fakeStrategy(ApplyStrategyName.PageRouter, async () => notApplied('router missing'));
    const dialog = fakeStrategy(ApplyStrategyName.PinDialog, async () => {
      throw new Error('dialog exploded');
    });
    const reload = fakeStrategy(ApplyStrategyName.PageReload, async () => RELOADING);

    const result = await applyPinsWith([], [router, dialog, reload])({
      pins: [CAST_FILTER],
      mode: ApplyMode.Replace,
      view: null,
    });

    expect(result.outcome).toBe(ApplyPinsOutcome.Reloading);
    expect(result.strategy).toBe(ApplyStrategyName.PageReload);
  });

  it('reports every failed strategy when none succeeds', async () => {
    const router = fakeStrategy(ApplyStrategyName.PageRouter, async () => notApplied('router missing'));
    const dialog = fakeStrategy(ApplyStrategyName.PinDialog, async () => notApplied('dialog missing'));

    const applying = applyPinsWith([], [router, dialog])({ pins: [CAST_FILTER], mode: ApplyMode.Add, view: null });

    await expect(applying).rejects.toBeInstanceOf(ApplyPinsError);
    await expect(applying).rejects.toThrow('[page-router] router missing [pin-dialog] dialog missing');
  });

  it('does not touch the page when the pins are already active', async () => {
    const router = fakeStrategy(ApplyStrategyName.PageRouter, async () => APPLIED);

    const result = await applyPinsWith([DEATH_BADGE], [router])({
      pins: [DEATH_BADGE],
      mode: ApplyMode.Add,
      view: null,
    });

    expect(result.outcome).toBe(ApplyPinsOutcome.Unchanged);
    expect(router.apply).not.toHaveBeenCalled();
  });

  it('leaves the current view alone for items without a saved view', async () => {
    const router = fakeStrategy(ApplyStrategyName.PageRouter, async () => APPLIED);

    const result = await applyPinsWith([], [router], DAMAGE_TAKEN_EVENTS)({
      pins: [DEATH_BADGE],
      mode: ApplyMode.Add,
      view: null,
    });

    expect(result.isViewChanged).toBe(false);
    expect(router.apply).toHaveBeenCalledWith({ activePins: [], targetPins: [DEATH_BADGE], targetView: null });
  });

  it('hands the saved view to the strategy together with the pins', async () => {
    const router = fakeStrategy(ApplyStrategyName.PageRouter, async () => APPLIED);

    const result = await applyPinsWith([MOONFIRE_DECORATOR], [router])({
      pins: [DEATH_BADGE],
      mode: ApplyMode.Add,
      view: DAMAGE_TAKEN_EVENTS,
    });

    expect(result.isViewChanged).toBe(true);
    expect(router.apply).toHaveBeenCalledWith({
      activePins: [MOONFIRE_DECORATOR],
      targetPins: [MOONFIRE_DECORATOR, DEATH_BADGE],
      targetView: DAMAGE_TAKEN_EVENTS,
    });
  });

  it('switches only the view when the pins are already active', async () => {
    const router = fakeStrategy(ApplyStrategyName.PageRouter, async () => APPLIED);

    const result = await applyPinsWith([DEATH_BADGE], [router])({
      pins: [DEATH_BADGE],
      mode: ApplyMode.Add,
      view: DAMAGE_TAKEN_EVENTS,
    });

    expect(result).toMatchObject({ outcome: ApplyPinsOutcome.Applied, isViewChanged: true });
    expect(router.apply).toHaveBeenCalledOnce();
  });
});
