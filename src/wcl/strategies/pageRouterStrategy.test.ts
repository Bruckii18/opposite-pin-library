import { describe, expect, it, vi } from 'vitest';
import { ApplyMode, createApplyPlan } from '../../apply/applyPlan';
import { APPLIED, notApplied } from '../../apply/applyStrategy';
import { DEATH_BADGE, MOONFIRE_DECORATOR } from '../../test/pinFixtures';
import { RoutePinsStatus, type RoutePinsStatus as Status } from '../pageBridgeProtocol';
import { joinPins } from '../pinString';
import type { ViewParams } from '../viewParams';
import { createPageRouterStrategy } from './pageRouterStrategy';

const DAMAGE_TAKEN_EVENTS: ViewParams = { type: 'damage-taken', ability: '1304424', view: 'events' };

const plan = createApplyPlan(
  { pins: [MOONFIRE_DECORATOR], view: {} },
  { pins: [DEATH_BADGE], mode: ApplyMode.Add, view: null },
);

function routerAnswering(status: Status, detail = '') {
  return vi.fn(async () => ({ requestId: 'request', status, detail }));
}

describe('pageRouterStrategy', () => {
  it('routes the joined target pins and confirms them in the URL', async () => {
    const routePins = routerAnswering(RoutePinsStatus.Routed);
    const waitForAppliedPlan = vi.fn(async () => true);
    const strategy = createPageRouterStrategy({ routePins, waitForAppliedPlan });

    const outcome = await strategy.apply(plan);

    expect(outcome).toEqual(APPLIED);
    expect(routePins).toHaveBeenCalledWith(joinPins([MOONFIRE_DECORATOR, DEATH_BADGE]), null);
    expect(waitForAppliedPlan).toHaveBeenCalledWith(plan);
  });

  it('routes the saved view in the same call as the pins', async () => {
    const routePins = routerAnswering(RoutePinsStatus.Routed);
    const strategy = createPageRouterStrategy({ routePins, waitForAppliedPlan: async () => true });
    const planWithView = createApplyPlan(
      { pins: [], view: {} },
      { pins: [DEATH_BADGE], mode: ApplyMode.Add, view: DAMAGE_TAKEN_EVENTS },
    );

    await strategy.apply(planWithView);

    expect(routePins).toHaveBeenCalledOnce();
    expect(routePins).toHaveBeenCalledWith(DEATH_BADGE, DAMAGE_TAKEN_EVENTS);
  });

  it('passes on why the router could not be used', async () => {
    const strategy = createPageRouterStrategy({
      routePins: routerAnswering(RoutePinsStatus.RouterMissing, 'window.queryRouting is not available.'),
      waitForAppliedPlan: async () => true,
    });

    expect(await strategy.apply(plan)).toEqual(notApplied('window.queryRouting is not available.'));
  });

  it('fails when the URL never shows the routed pins', async () => {
    const strategy = createPageRouterStrategy({
      routePins: routerAnswering(RoutePinsStatus.Routed),
      waitForAppliedPlan: async () => false,
    });

    expect(await strategy.apply(plan)).toEqual(notApplied('The report URL did not pick up the new pins.'));
  });
});
