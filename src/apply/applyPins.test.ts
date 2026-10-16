import { describe, expect, it, vi } from 'vitest';
import { CAST_FILTER, DEATH_BADGE, MOONFIRE_DECORATOR } from '../test/pinFixtures';
import type { PinString } from '../wcl/pinString';
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

function fakeStrategy(
  name: ApplyStrategy['name'],
  apply: (plan: PinApplyPlan) => Promise<StrategyOutcome>,
): ApplyStrategy {
  return { name, apply: vi.fn(apply) };
}

function applyPinsWith(activePins: readonly PinString[], strategies: readonly ApplyStrategy[]) {
  return createApplyPins({ readActivePins: () => activePins, strategies });
}

describe('createApplyPins', () => {
  it('uses the first strategy that applies the pins', async () => {
    const router = fakeStrategy(ApplyStrategyName.PageRouter, async () => APPLIED);
    const dialog = fakeStrategy(ApplyStrategyName.PinDialog, async () => APPLIED);

    const result = await applyPinsWith([MOONFIRE_DECORATOR], [router, dialog])([DEATH_BADGE], ApplyMode.Add);

    expect(result).toEqual({
      outcome: ApplyPinsOutcome.Applied,
      strategy: ApplyStrategyName.PageRouter,
      activePinCount: 2,
    });
    expect(router.apply).toHaveBeenCalledWith({
      activePins: [MOONFIRE_DECORATOR],
      targetPins: [MOONFIRE_DECORATOR, DEATH_BADGE],
    });
    expect(dialog.apply).not.toHaveBeenCalled();
  });

  it('falls back to the next strategy when one cannot apply or throws', async () => {
    const router = fakeStrategy(ApplyStrategyName.PageRouter, async () => notApplied('router missing'));
    const dialog = fakeStrategy(ApplyStrategyName.PinDialog, async () => {
      throw new Error('dialog exploded');
    });
    const reload = fakeStrategy(ApplyStrategyName.PageReload, async () => RELOADING);

    const result = await applyPinsWith([], [router, dialog, reload])([CAST_FILTER], ApplyMode.Replace);

    expect(result.outcome).toBe(ApplyPinsOutcome.Reloading);
    expect(result.strategy).toBe(ApplyStrategyName.PageReload);
  });

  it('reports every failed strategy when none succeeds', async () => {
    const router = fakeStrategy(ApplyStrategyName.PageRouter, async () => notApplied('router missing'));
    const dialog = fakeStrategy(ApplyStrategyName.PinDialog, async () => notApplied('dialog missing'));

    const applying = applyPinsWith([], [router, dialog])([CAST_FILTER], ApplyMode.Add);

    await expect(applying).rejects.toBeInstanceOf(ApplyPinsError);
    await expect(applying).rejects.toThrow('[page-router] router missing [pin-dialog] dialog missing');
  });

  it('does not touch the page when the pins are already active', async () => {
    const router = fakeStrategy(ApplyStrategyName.PageRouter, async () => APPLIED);

    const result = await applyPinsWith([DEATH_BADGE], [router])([DEATH_BADGE], ApplyMode.Add);

    expect(result.outcome).toBe(ApplyPinsOutcome.Unchanged);
    expect(router.apply).not.toHaveBeenCalled();
  });
});
