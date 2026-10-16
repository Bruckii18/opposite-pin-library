import { describe, expect, it, vi } from 'vitest';
import { ApplyMode, createApplyPlan } from '../../apply/applyPlan';
import { APPLIED, notApplied } from '../../apply/applyStrategy';
import { DEATH_BADGE, MOONFIRE_DECORATOR } from '../../test/pinFixtures';
import { RoutePinsStatus, type RoutePinsStatus as Status } from '../pageBridgeProtocol';
import { joinPins } from '../pinString';
import { createPageRouterStrategy } from './pageRouterStrategy';

const plan = createApplyPlan([MOONFIRE_DECORATOR], [DEATH_BADGE], ApplyMode.Add);

function routerAnswering(status: Status, detail = '') {
  return vi.fn(async () => ({ requestId: 'request', status, detail }));
}

describe('pageRouterStrategy', () => {
  it('routes the joined target pins and confirms them in the URL', async () => {
    const routePins = routerAnswering(RoutePinsStatus.Routed);
    const waitForActivePins = vi.fn(async () => true);
    const strategy = createPageRouterStrategy({ routePins, waitForActivePins });

    const outcome = await strategy.apply(plan);

    expect(outcome).toEqual(APPLIED);
    expect(routePins).toHaveBeenCalledWith(joinPins([MOONFIRE_DECORATOR, DEATH_BADGE]));
    expect(waitForActivePins).toHaveBeenCalledWith([MOONFIRE_DECORATOR, DEATH_BADGE]);
  });

  it('passes on why the router could not be used', async () => {
    const strategy = createPageRouterStrategy({
      routePins: routerAnswering(RoutePinsStatus.RouterMissing, 'window.queryRouting is not available.'),
      waitForActivePins: async () => true,
    });

    expect(await strategy.apply(plan)).toEqual(notApplied('window.queryRouting is not available.'));
  });

  it('fails when the URL never shows the routed pins', async () => {
    const strategy = createPageRouterStrategy({
      routePins: routerAnswering(RoutePinsStatus.Routed),
      waitForActivePins: async () => false,
    });

    expect(await strategy.apply(plan)).toEqual(notApplied('The report URL did not pick up the new pins.'));
  });
});
