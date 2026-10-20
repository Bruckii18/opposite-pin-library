import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import '../content/pageBridge';
import { installFakeQueryRouter, installFakeWclPage, removeFakeQueryRouter } from '../test/fakeWclPage';
import { DEATH_BADGE, MOONFIRE_DECORATOR } from '../test/pinFixtures';
import { RoutePinsStatus } from './pageBridgeProtocol';
import { createPageRouterClient } from './pageRouterClient';
import { joinPins } from './pinString';
import { readViewParams } from './reportUrl';
import { PAGE_ROUTER_GLOBAL } from './wclContract';

const BRIDGE_TIMEOUT_MS = 50;
const routePins = createPageRouterClient(window, BRIDGE_TIMEOUT_MS);
const REPORT_PATH = '/reports/AbC123?fight=1';
const REPORT_AND_VIEW_PARAMS = 'boss=3513&difficulty=5&wipes=1&source=12&type=casts&view=timeline';
const MISSING_VALUES: ReadonlySet<unknown> = new Set([null, undefined, '', 'null', 'undefined']);

describe('page bridge', () => {
  beforeEach(() => {
    history.replaceState(null, '', REPORT_PATH);
    installFakeWclPage([MOONFIRE_DECORATOR]);
    history.replaceState(null, '', `${location.href}&modal=pins`);
  });

  afterEach(removeFakeQueryRouter);

  it("routes the new pins through WCL's query router and closes the dialog", async () => {
    installFakeQueryRouter();

    const response = await routePins(joinPins([MOONFIRE_DECORATOR, DEATH_BADGE]), null);

    const url = new URL(location.href);
    expect(response.status).toBe(RoutePinsStatus.Routed);
    expect(url.searchParams.get('pins')).toBe(joinPins([MOONFIRE_DECORATOR, DEATH_BADGE]));
    expect(url.searchParams.get('modal')).toBeNull();
    expect(url.searchParams.get('fight')).toBe('1');
  });

  it('removes the pins parameter when asked to route no pins', async () => {
    installFakeQueryRouter();

    await routePins(null, null);

    expect(new URL(location.href).searchParams.has('pins')).toBe(false);
  });

  it('merges the saved view into the current query and keeps the report-specific params', async () => {
    history.replaceState(null, '', `${location.href}&${REPORT_AND_VIEW_PARAMS}`);
    installFakeQueryRouter();

    await routePins(DEATH_BADGE, { tab: 'damage-taken', ability: '1304424' });

    const url = new URL(location.href);
    expect(readViewParams(url)).toEqual({ tab: 'damage-taken', ability: '1304424' });
    expect(url.searchParams.get('pins')).toBe(DEATH_BADGE);
    expect(url.searchParams.get('fight')).toBe('1');
    expect(url.searchParams.get('boss')).toBe('3513');
    expect(url.searchParams.get('difficulty')).toBe('5');
    expect(url.searchParams.get('wipes')).toBe('1');
    expect(url.searchParams.get('source')).toBe('12');
  });

  it('leaves the view params untouched when the request has no saved view', async () => {
    history.replaceState(null, '', `${location.href}&${REPORT_AND_VIEW_PARAMS}`);
    installFakeQueryRouter();

    await routePins(DEATH_BADGE, null);

    expect(readViewParams(new URL(location.href))).toEqual({ tab: 'casts', view: 'timeline' });
  });

  it('keeps spells and hostility of the current view when the request has no saved view', async () => {
    history.replaceState(null, '', `${location.href}&type=auras&spells=debuffs&hostility=1`);
    installFakeQueryRouter();

    await routePins(DEATH_BADGE, null);

    const url = new URL(location.href);
    expect(url.searchParams.get('spells')).toBe('debuffs');
    expect(url.searchParams.get('hostility')).toBe('1');
  });

  it('routes a Debuffs view as type=auras with spells=debuffs', async () => {
    installFakeQueryRouter();

    await routePins(DEATH_BADGE, { tab: 'debuffs', ability: '1282419' });

    const url = new URL(location.href);
    expect(url.searchParams.get('type')).toBe('auras');
    expect(url.searchParams.get('spells')).toBe('debuffs');
    expect(readViewParams(url)).toEqual({ tab: 'debuffs', ability: '1282419' });
  });

  it('removes spells, hostility and ability when a Debuffs pin is followed by a Damage Taken pin', async () => {
    installFakeQueryRouter();

    await routePins(DEATH_BADGE, { tab: 'debuffs', hostility: '1', ability: '1282419' });
    await routePins(MOONFIRE_DECORATOR, { tab: 'damage-taken' });

    const url = new URL(location.href);
    expect(url.searchParams.get('type')).toBe('damage-taken');
    expect(url.searchParams.has('spells')).toBe(false);
    expect(url.searchParams.has('hostility')).toBe(false);
    expect(url.searchParams.has('ability')).toBe(false);
    expect(url.searchParams.get('fight')).toBe('1');
  });

  it('never routes null, undefined or their literal strings', async () => {
    history.replaceState(null, '', `${location.href}&target=null&start=undefined&ability=undefined&spells=`);
    const router = installFakeQueryRouter();

    await routePins(DEATH_BADGE, null);
    await routePins(DEATH_BADGE, { tab: 'debuffs' });

    const routedValues = router.routedQueries.flatMap((query) => Object.values(query));
    expect(routedValues.filter((value) => MISSING_VALUES.has(value))).toEqual([]);
    expect(new URL(location.href).searchParams.get('fight')).toBe('1');
  });

  it('reports a missing router', async () => {
    const response = await routePins(DEATH_BADGE, null);

    expect(response.status).toBe(RoutePinsStatus.RouterMissing);
  });

  it('reports a router that throws', async () => {
    Reflect.set(window, PAGE_ROUTER_GLOBAL, {
      get: () => ({}),
      set: () => {
        throw new Error('router broke');
      },
    });

    const response = await routePins(DEATH_BADGE, null);

    expect(response).toMatchObject({ status: RoutePinsStatus.RouterFailed, detail: 'router broke' });
  });

  it('reports a missing bridge when nobody answers', async () => {
    const isolatedTarget = new EventTarget();

    const response = await createPageRouterClient(isolatedTarget, BRIDGE_TIMEOUT_MS)(DEATH_BADGE, null);

    expect(response.status).toBe(RoutePinsStatus.BridgeMissing);
  });
});
