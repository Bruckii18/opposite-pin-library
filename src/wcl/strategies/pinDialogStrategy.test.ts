import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApplyMode, createApplyPlan } from '../../apply/applyPlan';
import { APPLIED, StrategyOutcomeStatus } from '../../apply/applyStrategy';
import { createConditionWaiter } from '../../shared/conditionWaiter';
import { installFakeWclPage, type FakeWclPage } from '../../test/fakeWclPage';
import { CAST_FILTER, DEATH_BADGE, MOONFIRE_DECORATOR } from '../../test/pinFixtures';
import { createActivePinsWaiter } from '../activePinsWaiter';
import { createPinDialogStrategy } from './pinDialogStrategy';

const waitUntil = createConditionWaiter({ timeoutMs: 200, intervalMs: 5 });
const pinDialogStrategy = createPinDialogStrategy({
  document,
  waitUntil,
  waitForActivePins: createActivePinsWaiter({ readCurrentUrl: () => location.href, waitUntil }),
});

describe('pinDialogStrategy', () => {
  let page: FakeWclPage;

  beforeEach(() => {
    page = installFakeWclPage([MOONFIRE_DECORATOR]);
  });

  it('pastes the new pins into the From Paste tab and creates them', async () => {
    const plan = createApplyPlan(page.readActivePins(), [DEATH_BADGE, CAST_FILTER], ApplyMode.Add);

    const outcome = await pinDialogStrategy.apply(plan);

    expect(outcome).toEqual(APPLIED);
    expect(page.readActivePins()).toEqual([MOONFIRE_DECORATOR, DEATH_BADGE, CAST_FILTER]);
    expect(document.querySelector('#pins-ui-tab-paste')?.classList.contains('selected')).toBe(true);
  });

  it('closes a dialog that is already open before reopening it', async () => {
    page.dialog.style.display = 'block';
    const openClicks = vi.fn();
    page.openButton.addEventListener('click', openClicks);

    const outcome = await pinDialogStrategy.apply(
      createApplyPlan(page.readActivePins(), [DEATH_BADGE], ApplyMode.Add),
    );

    expect(outcome).toEqual(APPLIED);
    expect(openClicks).toHaveBeenCalledTimes(1);
  });

  it('refuses plans that would remove active pins', async () => {
    const outcome = await pinDialogStrategy.apply(
      createApplyPlan(page.readActivePins(), [DEATH_BADGE], ApplyMode.Replace),
    );

    expect(outcome.status).toBe(StrategyOutcomeStatus.NotApplied);
    expect(page.readActivePins()).toEqual([MOONFIRE_DECORATOR]);
  });

  it('names the missing dialog elements when WCL changed its markup', async () => {
    document.querySelector('#pins-ui-paste-box')?.remove();

    const outcome = await pinDialogStrategy.apply(
      createApplyPlan(page.readActivePins(), [DEATH_BADGE], ApplyMode.Add),
    );

    expect(outcome).toEqual({
      status: StrategyOutcomeStatus.NotApplied,
      reason: 'Add Pin dialog elements not found: #pins-ui-paste-box.',
    });
  });
});
