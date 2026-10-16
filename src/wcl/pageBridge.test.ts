import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import '../content/pageBridge';
import { installFakeQueryRouter, installFakeWclPage, removeFakeQueryRouter } from '../test/fakeWclPage';
import { DEATH_BADGE, MOONFIRE_DECORATOR } from '../test/pinFixtures';
import { RoutePinsStatus } from './pageBridgeProtocol';
import { createPageRouterClient } from './pageRouterClient';
import { joinPins } from './pinString';
import { PAGE_ROUTER_GLOBAL } from './wclContract';

const BRIDGE_TIMEOUT_MS = 50;
const routePins = createPageRouterClient(window, BRIDGE_TIMEOUT_MS);

describe('page bridge', () => {
  beforeEach(() => {
    installFakeWclPage([MOONFIRE_DECORATOR]);
    history.replaceState(null, '', `${location.href}&modal=pins`);
  });

  afterEach(removeFakeQueryRouter);

  it("routes the new pins through WCL's query router and closes the dialog", async () => {
    installFakeQueryRouter();

    const response = await routePins(joinPins([MOONFIRE_DECORATOR, DEATH_BADGE]));

    const url = new URL(location.href);
    expect(response.status).toBe(RoutePinsStatus.Routed);
    expect(url.searchParams.get('pins')).toBe(joinPins([MOONFIRE_DECORATOR, DEATH_BADGE]));
    expect(url.searchParams.get('modal')).toBeNull();
    expect(url.searchParams.get('fight')).toBe('1');
  });

  it('removes the pins parameter when asked to route no pins', async () => {
    installFakeQueryRouter();

    await routePins(null);

    expect(new URL(location.href).searchParams.has('pins')).toBe(false);
  });

  it('reports a missing router', async () => {
    const response = await routePins(DEATH_BADGE);

    expect(response.status).toBe(RoutePinsStatus.RouterMissing);
  });

  it('reports a router that throws', async () => {
    Reflect.set(window, PAGE_ROUTER_GLOBAL, {
      get: () => ({}),
      set: () => {
        throw new Error('router broke');
      },
    });

    const response = await routePins(DEATH_BADGE);

    expect(response).toMatchObject({ status: RoutePinsStatus.RouterFailed, detail: 'router broke' });
  });

  it('reports a missing bridge when nobody answers', async () => {
    const isolatedTarget = new EventTarget();

    const response = await createPageRouterClient(isolatedTarget, BRIDGE_TIMEOUT_MS)(DEATH_BADGE);

    expect(response.status).toBe(RoutePinsStatus.BridgeMissing);
  });
});
