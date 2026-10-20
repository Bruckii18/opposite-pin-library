import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApplyMode, createApplyPlan, type PinApplyRequest } from '../../apply/applyPlan';
import { APPLIED, StrategyOutcomeStatus } from '../../apply/applyStrategy';
import { createConditionWaiter } from '../../shared/conditionWaiter';
import { installFakeWclPage, type FakeWclPage } from '../../test/fakeWclPage';
import { CAST_FILTER, DEATH_BADGE, MOONFIRE_DECORATOR } from '../../test/pinFixtures';
import type { PinString } from '../pinString';
import { createAppliedPlanWaiter } from '../appliedPlanWaiter';
import { createPinDialogStrategy } from './pinDialogStrategy';

const waitUntil = createConditionWaiter({ timeoutMs: 200, intervalMs: 5 });
const pinDialogStrategy = createPinDialogStrategy({
  document,
  waitUntil,
  waitForAppliedPlan: createAppliedPlanWaiter({ readCurrentUrl: () => location.href, waitUntil }),
});

function planFor(activePins: readonly PinString[], request: Partial<PinApplyRequest>) {
  return createApplyPlan(
    { pins: activePins, viewQuery: {} },
    { pins: [], mode: ApplyMode.Add, view: null, ...request },
  );
}

describe('pinDialogStrategy', () => {
  let page: FakeWclPage;

  beforeEach(() => {
    page = installFakeWclPage([MOONFIRE_DECORATOR]);
  });

  it('pastes the new pins into the From Paste tab and creates them', async () => {
    const plan = planFor(page.readActivePins(), { pins: [DEATH_BADGE, CAST_FILTER] });

    const outcome = await pinDialogStrategy.apply(plan);

    expect(outcome).toEqual(APPLIED);
    expect(page.readActivePins()).toEqual([MOONFIRE_DECORATOR, DEATH_BADGE, CAST_FILTER]);
    expect(document.querySelector('#pins-ui-tab-paste')?.classList.contains('selected')).toBe(true);
  });

  it('closes a dialog that is already open before reopening it', async () => {
    page.dialog.style.display = 'block';
    const openClicks = vi.fn();
    page.openButton.addEventListener('click', openClicks);

    const outcome = await pinDialogStrategy.apply(planFor(page.readActivePins(), { pins: [DEATH_BADGE] }));

    expect(outcome).toEqual(APPLIED);
    expect(openClicks).toHaveBeenCalledTimes(1);
  });

  it('refuses plans that would remove active pins', async () => {
    const outcome = await pinDialogStrategy.apply(
      planFor(page.readActivePins(), { pins: [DEATH_BADGE], mode: ApplyMode.Replace }),
    );

    expect(outcome.status).toBe(StrategyOutcomeStatus.NotApplied);
    expect(page.readActivePins()).toEqual([MOONFIRE_DECORATOR]);
  });

  it('refuses plans that change the report view, so the reload applies pins and view together', async () => {
    const outcome = await pinDialogStrategy.apply(
      planFor(page.readActivePins(), { pins: [DEATH_BADGE], view: { tab: 'damage-taken' } }),
    );

    expect(outcome).toEqual({
      status: StrategyOutcomeStatus.NotApplied,
      reason: 'The Add Pin dialog cannot change the report view.',
    });
    expect(page.readActivePins()).toEqual([MOONFIRE_DECORATOR]);
  });

  it('names the missing dialog elements when WCL changed its markup', async () => {
    document.querySelector('#pins-ui-paste-box')?.remove();

    const outcome = await pinDialogStrategy.apply(planFor(page.readActivePins(), { pins: [DEATH_BADGE] }));

    expect(outcome).toEqual({
      status: StrategyOutcomeStatus.NotApplied,
      reason: 'Add Pin dialog elements not found: #pins-ui-paste-box.',
    });
  });
});
