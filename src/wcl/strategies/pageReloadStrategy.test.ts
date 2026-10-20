import { describe, expect, it, vi } from 'vitest';
import { ApplyMode, createApplyPlan, type PinApplyPlan } from '../../apply/applyPlan';
import { RELOADING } from '../../apply/applyStrategy';
import { DEATH_BADGE, MOONFIRE_DECORATOR } from '../../test/pinFixtures';
import { readActivePins, readViewParams } from '../reportUrl';
import { createPageReloadStrategy } from './pageReloadStrategy';

const REPORT_URL = 'https://www.warcraftlogs.com/reports/AbC123?fight=4&boss=3513&type=casts&view=timeline&modal=pins';

async function reloadWith(plan: PinApplyPlan) {
  const navigate = vi.fn<(url: string) => void>();
  const strategy = createPageReloadStrategy({ readCurrentUrl: () => REPORT_URL, navigate });
  const outcome = await strategy.apply(plan);
  return { outcome, targetUrl: new URL(navigate.mock.calls[0]?.[0] ?? '') };
}

describe('pageReloadStrategy', () => {
  it('navigates to the report URL with the target pins and without the dialog', async () => {
    const { outcome, targetUrl } = await reloadWith(
      createApplyPlan(
        { pins: [MOONFIRE_DECORATOR], view: {} },
        { pins: [DEATH_BADGE], mode: ApplyMode.Replace, view: null },
      ),
    );

    expect(outcome).toEqual(RELOADING);
    expect(readActivePins(targetUrl)).toEqual([DEATH_BADGE]);
    expect(targetUrl.searchParams.get('fight')).toBe('4');
    expect(targetUrl.searchParams.has('modal')).toBe(false);
    expect(readViewParams(targetUrl)).toEqual({ type: 'casts', view: 'timeline' });
  });

  it('loads the saved view in the same navigation and keeps the report-specific params', async () => {
    const { targetUrl } = await reloadWith(
      createApplyPlan(
        { pins: [], view: { type: 'casts', view: 'timeline' } },
        { pins: [DEATH_BADGE], mode: ApplyMode.Add, view: { type: 'damage-taken', ability: '1304424' } },
      ),
    );

    expect(readActivePins(targetUrl)).toEqual([DEATH_BADGE]);
    expect(readViewParams(targetUrl)).toEqual({ type: 'damage-taken', ability: '1304424' });
    expect(targetUrl.searchParams.get('fight')).toBe('4');
    expect(targetUrl.searchParams.get('boss')).toBe('3513');
  });
});
