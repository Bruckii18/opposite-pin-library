import { describe, expect, it } from 'vitest';
import { isViewParams, sanitizeViewParams, tabFromQuery, toQueryParams, viewParamsFromQuery } from './viewParams';
import { WCL_TAB_KEYS, WCL_TABS } from './wclContract';

describe('tabFromQuery', () => {
  it.each([
    [{ type: 'auras', spells: 'debuffs' }, 'debuffs'],
    [{ type: 'auras' }, 'buffs'],
    [{ type: 'damage-taken' }, 'damage-taken'],
    [{ type: 'summary' }, 'summary'],
    [{ type: 'threat' }, 'threat'],
  ])('maps %j to the %s tab', (query, tab) => {
    expect(tabFromQuery(query)).toBe(tab);
  });

  it.each([
    [{ type: 'debuffs' }, 'debuffs'],
    [{ type: 'buffs' }, 'buffs'],
  ])('maps the legacy, invalid %j to the %s tab', (query, tab) => {
    expect(tabFromQuery(query)).toBe(tab);
  });

  it('ignores a leftover spells param on tabs that do not use it', () => {
    expect(tabFromQuery({ type: 'damage-taken', spells: 'debuffs' })).toBe('damage-taken');
  });

  it.each([{}, { type: 'threat-plot' }, { type: 'null' }, { type: '' }, { spells: 'debuffs' }])(
    'finds no tab for %j',
    (query) => {
      expect(tabFromQuery(query)).toBeUndefined();
    },
  );

  it('maps the URL params of every tab back to that tab', () => {
    for (const tab of WCL_TAB_KEYS) {
      expect(tabFromQuery(WCL_TABS[tab].query)).toBe(tab);
    }
  });
});

describe('toQueryParams', () => {
  it('expands the Debuffs tab into type=auras and spells=debuffs', () => {
    expect(toQueryParams({ tab: 'debuffs', ability: '1282419' })).toStrictEqual({
      type: 'auras',
      spells: 'debuffs',
      ability: '1282419',
    });
  });

  it('expands the Buffs tab into type=auras without spells', () => {
    expect(toQueryParams({ tab: 'buffs' })).toStrictEqual({ type: 'auras' });
  });

  it('writes hostility and layout next to the tab', () => {
    expect(toQueryParams({ tab: 'damage-taken', hostility: '1', view: 'events' })).toStrictEqual({
      type: 'damage-taken',
      hostility: '1',
      view: 'events',
    });
  });

  it('produces no params for the default view', () => {
    expect(toQueryParams({})).toStrictEqual({});
  });

  it('round-trips every tab through the URL params', () => {
    for (const tab of WCL_TAB_KEYS) {
      expect(viewParamsFromQuery(toQueryParams({ tab }))).toStrictEqual({ tab });
    }
  });
});

describe('sanitizeViewParams', () => {
  it('drops missing values and the strings they were stringified to', () => {
    expect(sanitizeViewParams({ tab: 'null', hostility: 'undefined', ability: '', view: 'NaN' })).toStrictEqual({});
    expect(sanitizeViewParams({ tab: null, hostility: undefined, ability: null, view: undefined })).toStrictEqual({});
  });

  it('drops an ability that is not a numeric spell ID', () => {
    expect(sanitizeViewParams({ tab: 'casts', ability: 'Fireball' })).toStrictEqual({ tab: 'casts' });
    expect(sanitizeViewParams({ ability: '12.5' })).toStrictEqual({});
    expect(sanitizeViewParams({ ability: 1304424 })).toStrictEqual({});
  });

  it('accepts only Friendlies (0) and Enemies (1) as hostility', () => {
    expect(sanitizeViewParams({ hostility: '0' })).toStrictEqual({ hostility: '0' });
    expect(sanitizeViewParams({ hostility: '1' })).toStrictEqual({ hostility: '1' });
    expect(sanitizeViewParams({ hostility: '2' })).toStrictEqual({});
  });

  it('accepts only known layouts', () => {
    expect(sanitizeViewParams({ view: 'events' })).toStrictEqual({ view: 'events' });
    expect(sanitizeViewParams({ view: 'timeline' })).toStrictEqual({ view: 'timeline' });
    expect(sanitizeViewParams({ view: 'tables' })).toStrictEqual({});
  });

  it('drops raw URL params and report-specific params', () => {
    expect(sanitizeViewParams({ tab: 'deaths', type: 'auras', fight: '3', source: '12' })).toStrictEqual({
      tab: 'deaths',
    });
  });
});

describe('viewParamsFromQuery', () => {
  it('reads tab, hostility, ability and layout and skips report-specific params', () => {
    const query = {
      type: 'auras',
      spells: 'debuffs',
      hostility: '1',
      ability: '1282419',
      view: 'timeline',
      fight: '3',
      source: '12',
    };

    expect(viewParamsFromQuery(query)).toStrictEqual({
      tab: 'debuffs',
      hostility: '1',
      ability: '1282419',
      view: 'timeline',
    });
  });

  it('drops an unknown type and keeps the rest', () => {
    expect(viewParamsFromQuery({ type: 'not-a-tab', ability: '1304424' })).toStrictEqual({ ability: '1304424' });
  });
});

describe('isViewParams', () => {
  it('accepts complete and empty view params', () => {
    expect(isViewParams({ tab: 'debuffs', hostility: '1', ability: '1282419', view: 'events' })).toBe(true);
    expect(isViewParams({})).toBe(true);
  });

  it.each([null, [], 'debuffs', { type: 'auras' }, { tab: 'auras' }, { ability: 'null' }, { tab: 'casts', fight: '3' }])(
    'rejects %j',
    (value) => {
      expect(isViewParams(value)).toBe(false);
    },
  );
});
