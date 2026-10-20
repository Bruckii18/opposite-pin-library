import { describe, expect, it, vi } from 'vitest';
import { ApplyMode, createApplyPlan, type PinApplyPlan } from '../../apply/applyPlan';
import { RELOADING } from '../../apply/applyStrategy';
import { DEATH_BADGE, MOONFIRE_DECORATOR } from '../../test/pinFixtures';
import { readActivePins, readViewParams, readViewQuery } from '../reportUrl';
import { createPageReloadStrategy } from './pageReloadStrategy';

const REPORT_URL = 'https://www.warcraftlogs.com/reports/AbC123?fight=4&boss=3513&type=casts&view=timeline&modal=pins';
const DEBUFFS_ENEMIES_URL =
  'https://www.warcraftlogs.com/reports/AbC123?fight=4&boss=3513&type=auras&spells=debuffs&hostility=1&ability=1282419';
const MISSING_VALUES: ReadonlySet<string> = new Set(['', 'null', 'undefined']);

async function reloadWith(plan: PinApplyPlan, currentUrl = REPORT_URL) {
  const navigate = vi.fn<(url: string) => void>();
  const strategy = createPageReloadStrategy({ readCurrentUrl: () => currentUrl, navigate });
  const outcome = await strategy.apply(plan);
  return { outcome, targetUrl: new URL(navigate.mock.calls[0]?.[0] ?? '') };
}

describe('pageReloadStrategy', () => {
  it('navigates to the report URL with the target pins and without the dialog', async () => {
    const { outcome, targetUrl } = await reloadWith(
      createApplyPlan(
        { pins: [MOONFIRE_DECORATOR], viewQuery: {} },
        { pins: [DEATH_BADGE], mode: ApplyMode.Replace, view: null },
      ),
    );

    expect(outcome).toEqual(RELOADING);
    expect(readActivePins(targetUrl)).toEqual([DEATH_BADGE]);
    expect(targetUrl.searchParams.get('fight')).toBe('4');
    expect(targetUrl.searchParams.has('modal')).toBe(false);
    expect(readViewParams(targetUrl)).toEqual({ tab: 'casts', view: 'timeline' });
  });

  it('loads the saved view in the same navigation and keeps the report-specific params', async () => {
    const { targetUrl } = await reloadWith(
      createApplyPlan(
        { pins: [], viewQuery: { type: 'casts', view: 'timeline' } },
        { pins: [DEATH_BADGE], mode: ApplyMode.Add, view: { tab: 'damage-taken', ability: '1304424' } },
      ),
    );

    expect(readActivePins(targetUrl)).toEqual([DEATH_BADGE]);
    expect(readViewParams(targetUrl)).toEqual({ tab: 'damage-taken', ability: '1304424' });
    expect(targetUrl.searchParams.get('fight')).toBe('4');
    expect(targetUrl.searchParams.get('boss')).toBe('3513');
  });

  it('removes spells and hostility when switching from Enemies on Debuffs to Damage Taken', async () => {
    const { targetUrl } = await reloadWith(
      createApplyPlan(
        { pins: [], viewQuery: readViewQuery(new URL(DEBUFFS_ENEMIES_URL)) },
        { pins: [DEATH_BADGE], mode: ApplyMode.Add, view: { tab: 'damage-taken' } },
      ),
      DEBUFFS_ENEMIES_URL,
    );

    expect(readViewQuery(targetUrl)).toEqual({ type: 'damage-taken' });
    expect(targetUrl.searchParams.get('boss')).toBe('3513');
  });

  it('never writes empty, "null" or "undefined" values into the URL', async () => {
    const { targetUrl } = await reloadWith(
      createApplyPlan(
        { pins: [], viewQuery: {} },
        { pins: [DEATH_BADGE], mode: ApplyMode.Add, view: { tab: 'debuffs' } },
      ),
      `${REPORT_URL}&source=undefined&target=null&ability=null&spells=`,
    );

    expect([...targetUrl.searchParams.values()].filter((value) => MISSING_VALUES.has(value))).toEqual([]);
    expect(readViewQuery(targetUrl)).toEqual({ type: 'auras', spells: 'debuffs' });
  });
});
