import { describe, expect, it, vi } from 'vitest';
import { ApplyMode, createApplyPlan } from '../../apply/applyPlan';
import { RELOADING } from '../../apply/applyStrategy';
import { DEATH_BADGE, MOONFIRE_DECORATOR } from '../../test/pinFixtures';
import { readActivePins } from '../reportUrl';
import { createPageReloadStrategy } from './pageReloadStrategy';

describe('pageReloadStrategy', () => {
  it('navigates to the report URL with the target pins and without the dialog', async () => {
    const navigate = vi.fn<(url: string) => void>();
    const strategy = createPageReloadStrategy({
      readCurrentUrl: () => 'https://www.warcraftlogs.com/reports/AbC123?fight=4&modal=pins',
      navigate,
    });

    const outcome = await strategy.apply(
      createApplyPlan([MOONFIRE_DECORATOR], [DEATH_BADGE], ApplyMode.Replace),
    );

    const targetUrl = new URL(navigate.mock.calls[0]?.[0] ?? '');
    expect(outcome).toEqual(RELOADING);
    expect(readActivePins(targetUrl)).toEqual([DEATH_BADGE]);
    expect(targetUrl.searchParams.get('fight')).toBe('4');
    expect(targetUrl.searchParams.has('modal')).toBe(false);
  });
});
