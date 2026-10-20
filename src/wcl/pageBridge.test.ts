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

    await routePins(DEATH_BADGE, { type: 'damage-taken', ability: '1304424' });

    const url = new URL(location.href);
    expect(readViewParams(url)).toEqual({ type: 'damage-taken', ability: '1304424' });
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

    expect(readViewParams(new URL(location.href))).toEqual({ type: 'casts', view: 'timeline' });
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
