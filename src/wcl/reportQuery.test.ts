import { describe, expect, it } from 'vitest';
import { DEATH_BADGE } from '../test/pinFixtures';
import { buildReportQuery, showsView } from './reportQuery';

const REPORT_PARAMS = {
  fight: '7',
  source: '12',
  target: '4',
  boss: '2920',
  difficulty: '4',
  wipes: '2',
  start: '1000',
  end: '9000',
};
const MISSING_VALUES: ReadonlySet<unknown> = new Set([null, undefined, '', 'null', 'undefined', 'NaN']);

describe('buildReportQuery', () => {
  it('replaces every view key with the saved view and keeps the report-specific params', () => {
    const currentQuery = {
      ...REPORT_PARAMS,
      type: 'auras',
      spells: 'debuffs',
      hostility: '1',
      ability: '1282419',
      view: 'events',
      modal: 'pins',
    };

    const query = buildReportQuery(currentQuery, { pinsQueryValue: DEATH_BADGE, viewParams: { tab: 'damage-taken' } });

    expect(query).toStrictEqual({ ...REPORT_PARAMS, type: 'damage-taken', pins: DEATH_BADGE });
  });

  it('removes spells when a Debuffs pin is followed by a Damage Taken pin', () => {
    const afterDebuffs = buildReportQuery(REPORT_PARAMS, {
      pinsQueryValue: DEATH_BADGE,
      viewParams: { tab: 'debuffs' },
    });
    const afterDamageTaken = buildReportQuery(afterDebuffs, {
      pinsQueryValue: DEATH_BADGE,
      viewParams: { tab: 'damage-taken' },
    });

    expect(afterDebuffs).toMatchObject({ type: 'auras', spells: 'debuffs' });
    expect(afterDamageTaken).toMatchObject({ type: 'damage-taken' });
    expect(afterDamageTaken).not.toHaveProperty('spells');
  });

  it('removes hostility when switching from Enemies to a view with the default Friendlies', () => {
    const query = buildReportQuery(
      { ...REPORT_PARAMS, type: 'damage-taken', hostility: '1' },
      { pinsQueryValue: null, viewParams: { tab: 'damage-taken' } },
    );

    expect(query).not.toHaveProperty('hostility');
  });

  it('leaves every view key alone for items without a saved view', () => {
    const currentQuery = {
      ...REPORT_PARAMS,
      type: 'auras',
      spells: 'debuffs',
      hostility: '1',
      ability: '1282419',
      view: 'timeline',
    };

    const query = buildReportQuery(currentQuery, { pinsQueryValue: DEATH_BADGE, viewParams: null });

    expect(query).toStrictEqual({ ...currentQuery, pins: DEATH_BADGE });
  });

  it('removes the pins and the dialog param when no pins remain', () => {
    const query = buildReportQuery(
      { ...REPORT_PARAMS, pins: DEATH_BADGE, modal: 'pins' },
      { pinsQueryValue: null, viewParams: null },
    );

    expect(query).toStrictEqual(REPORT_PARAMS);
  });

  it('never produces null, undefined or their literal strings', () => {
    const currentQuery = {
      fight: '7',
      source: null,
      target: undefined,
      start: 'null',
      end: 'undefined',
      boss: '',
      wipes: Number.NaN,
      ability: 'undefined',
    };

    const withoutView = buildReportQuery(currentQuery, { pinsQueryValue: DEATH_BADGE, viewParams: null });
    const withView = buildReportQuery(currentQuery, { pinsQueryValue: DEATH_BADGE, viewParams: { tab: 'debuffs' } });

    expect([...Object.values(withoutView), ...Object.values(withView)].filter((value) => MISSING_VALUES.has(value))).toEqual(
      [],
    );
    expect(withoutView).toStrictEqual({ fight: '7', pins: DEATH_BADGE });
  });

  it('passes on non-string values from the current query unchanged', () => {
    const query = buildReportQuery({ fight: 7, translate: true }, { pinsQueryValue: null, viewParams: null });

    expect(query).toStrictEqual({ fight: 7, translate: true });
  });
});

describe('showsView', () => {
  it('compares the exact URL params, so Buffs and Debuffs are different views', () => {
    expect(showsView({ type: 'auras' }, { tab: 'buffs' })).toBe(true);
    expect(showsView({ type: 'auras', spells: 'debuffs' }, { tab: 'debuffs' })).toBe(true);
    expect(showsView({ type: 'auras', spells: 'debuffs' }, { tab: 'buffs' })).toBe(false);
  });

  it('does not take a legacy type=debuffs URL for the Debuffs tab', () => {
    expect(showsView({ type: 'debuffs' }, { tab: 'debuffs' })).toBe(false);
  });
});
