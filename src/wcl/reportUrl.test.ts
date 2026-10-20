import { describe, expect, it } from 'vitest';
import { DEATH_BADGE, MOONFIRE_DECORATOR } from '../test/pinFixtures';
import { joinPins } from './pinString';
import {
  parseWclReportUrl,
  readActivePins,
  readViewParams,
  readViewQuery,
  toPinsQueryValue,
  withQueryChange,
} from './reportUrl';
import { VIEW_QUERY_PARAMS } from './wclContract';

const URL_CAPTURED_FROM_WCL =
  'https://www.warcraftlogs.com/reports/Xy7KpQ2mWn4RvB8d?fight=last&type=damage-done&view=events' +
  '&pins=0%24Off%24%23244F4B%24expression%24ability.name+%3D+%22Moonfire%22' +
  '%5E1%24Off%24%23A33C3C%24expression%24type+%3D+%22death%22';

describe('parseWclReportUrl', () => {
  it.each([
    'https://www.warcraftlogs.com/reports/AbC123',
    'https://classic.warcraftlogs.com/reports/AbC123?fight=3',
    'https://fresh.warcraftlogs.com/reports/AbC123',
    'https://sod.warcraftlogs.com/reports/AbC123',
    'https://de.warcraftlogs.com/reports/AbC123',
    'https://warcraftlogs.com/reports/AbC123',
  ])('accepts the report URL %s', (rawUrl) => {
    expect(parseWclReportUrl(rawUrl)?.href).toBe(rawUrl);
  });

  it.each([
    undefined,
    'not a url',
    'http://www.warcraftlogs.com/reports/AbC123',
    'https://www.warcraftlogs.com/character/eu/realm/name',
    'https://warcraftlogs.com.evil.example/reports/AbC123',
    'https://www.example.com/reports/AbC123',
  ])('rejects %s', (rawUrl) => {
    expect(parseWclReportUrl(rawUrl)).toBeNull();
  });
});

describe('readActivePins', () => {
  it('decodes the pins exactly as WCL wrote them into the URL', () => {
    expect(readActivePins(new URL(URL_CAPTURED_FROM_WCL))).toEqual([MOONFIRE_DECORATOR, DEATH_BADGE]);
  });

  it('returns no pins when the URL has no pins parameter', () => {
    expect(readActivePins(new URL('https://www.warcraftlogs.com/reports/AbC123'))).toEqual([]);
  });
});

describe('withQueryChange', () => {
  it('encodes pins the same way WCL does', () => {
    const reportUrl = new URL(URL_CAPTURED_FROM_WCL);
    reportUrl.searchParams.delete('pins');

    const updatedUrl = withQueryChange(reportUrl, {
      pinsQueryValue: joinPins([MOONFIRE_DECORATOR, DEATH_BADGE]),
      viewParams: null,
    });

    expect(updatedUrl.href).toBe(URL_CAPTURED_FROM_WCL);
  });

  it('closes the Add Pin dialog and keeps the other query parameters', () => {
    const reportUrl = new URL('https://www.warcraftlogs.com/reports/AbC123?fight=2&modal=pins');

    const updatedUrl = withQueryChange(reportUrl, { pinsQueryValue: DEATH_BADGE, viewParams: null });

    expect(updatedUrl.searchParams.get('modal')).toBeNull();
    expect(updatedUrl.searchParams.get('fight')).toBe('2');
    expect(readActivePins(updatedUrl)).toEqual([DEATH_BADGE]);
  });

  it('removes the pins parameter when no pins remain', () => {
    const updatedUrl = withQueryChange(new URL(URL_CAPTURED_FROM_WCL), { pinsQueryValue: null, viewParams: null });

    expect(updatedUrl.searchParams.has('pins')).toBe(false);
  });

  it('applies a view saved on one report to another report and changes only the view params', () => {
    const savedView = readViewParams(new URL(URL_WITH_SAVED_VIEW));
    const otherReport = new URL(OTHER_REPORT_URL);

    const updatedUrl = withQueryChange(otherReport, { pinsQueryValue: DEATH_BADGE, viewParams: savedView });

    expect(readViewParams(updatedUrl)).toEqual(savedView);
    expect(readActivePins(updatedUrl)).toEqual([DEATH_BADGE]);
    expect(updatedUrl.pathname).toBe(otherReport.pathname);
    expect(withoutViewAndPinParams(updatedUrl)).toEqual(withoutViewAndPinParams(otherReport));
  });

  it('removes the view params that the saved view does not produce', () => {
    const debuffsOnEnemies = new URL(`${OTHER_REPORT_URL}&spells=debuffs&hostility=1&ability=1282419`);

    const updatedUrl = withQueryChange(debuffsOnEnemies, { pinsQueryValue: null, viewParams: { tab: 'deaths' } });

    expect(readViewQuery(updatedUrl)).toEqual({ type: 'deaths' });
  });

  it('resets to the default view for a saved view without params', () => {
    const updatedUrl = withQueryChange(new URL(OTHER_REPORT_URL), { pinsQueryValue: null, viewParams: {} });

    expect(readViewQuery(updatedUrl)).toEqual({});
  });
});

const URL_WITH_SAVED_VIEW =
  'https://www.warcraftlogs.com/reports/Xy7KpQ2mWn4RvB8d?boss=3513&difficulty=5&wipes=1&view=events' +
  '&type=damage-taken&ability=1304424&pins=1%24Off%24%23A33C3C%24expression%24type+%3D+%22death%22';

const OTHER_REPORT_URL =
  'https://www.warcraftlogs.com/reports/Qm3ZtR8vLp5KxN2w?fight=7&source=12&target=4&boss=2920' +
  '&difficulty=4&wipes=2&start=1000&end=9000&type=casts&view=timeline';

const DEBUFFS_TAB_URL =
  'https://www.warcraftlogs.com/reports/Xy7KpQ2mWn4RvB8d?fight=5&type=auras&spells=debuffs&hostility=1&ability=1282419';

describe('readViewParams', () => {
  it('reads only the report-independent view params', () => {
    expect(readViewParams(new URL(URL_WITH_SAVED_VIEW))).toEqual({
      tab: 'damage-taken',
      ability: '1304424',
      view: 'events',
    });
  });

  it('captures the Debuffs tab from type=auras with spells=debuffs, not the Buffs tab', () => {
    expect(readViewParams(new URL(DEBUFFS_TAB_URL))).toEqual({
      tab: 'debuffs',
      hostility: '1',
      ability: '1282419',
    });
  });

  it('reads the default view as no params and ignores empty ones', () => {
    expect(readViewParams(new URL('https://www.warcraftlogs.com/reports/AbC123?fight=2&type='))).toEqual({});
  });
});

describe('readViewQuery', () => {
  it('reads the raw view params and skips missing values', () => {
    const reportUrl = new URL(`${DEBUFFS_TAB_URL}&view=undefined`);

    expect(readViewQuery(reportUrl)).toEqual({
      type: 'auras',
      spells: 'debuffs',
      hostility: '1',
      ability: '1282419',
    });
  });
});

const VIEW_AND_PIN_PARAMS = new Set<string>([...VIEW_QUERY_PARAMS, 'pins']);

function withoutViewAndPinParams(url: URL): [string, string][] {
  return [...url.searchParams].filter(([param]) => !VIEW_AND_PIN_PARAMS.has(param));
}

describe('toPinsQueryValue', () => {
  it('returns null for an empty pin list so the parameter can be removed', () => {
    expect(toPinsQueryValue([])).toBeNull();
    expect(toPinsQueryValue([DEATH_BADGE])).toBe(DEATH_BADGE);
  });
});
