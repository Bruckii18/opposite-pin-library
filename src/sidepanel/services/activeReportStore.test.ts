import { describe, expect, it, vi } from 'vitest';
import { DEATH_BADGE } from '../../test/pinFixtures';
import { joinPins } from '../../wcl/pinString';
import { ActiveReportStore, ActiveTabStatus, type TabsApi } from './activeReportStore';

type UpdatedListener = (tabId: number, changeInfo: chrome.tabs.OnUpdatedInfo, tab: chrome.tabs.Tab) => void;

function fakeTabsApi(initialUrl: string) {
  let activeTab = { id: 7, url: initialUrl, active: true } as chrome.tabs.Tab;
  const updatedListeners: UpdatedListener[] = [];
  const tabs = {
    query: vi.fn(async () => [activeTab]),
    onActivated: { addListener: vi.fn(), removeListener: vi.fn() },
    onUpdated: {
      addListener: (listener: UpdatedListener) => updatedListeners.push(listener),
      removeListener: vi.fn(),
    },
  } as unknown as TabsApi;
  const navigate = (url: string): void => {
    activeTab = { ...activeTab, url };
    updatedListeners.forEach((listener) => listener(7, { url }, activeTab));
  };
  return { tabs, navigate };
}

describe('ActiveReportStore', () => {
  it('reads the active pins and view of the report in the active tab', async () => {
    const reportUrl =
      'https://www.warcraftlogs.com/reports/AbC123?fight=3&type=damage-taken&ability=1304424' +
      `&pins=${encodeURIComponent(DEATH_BADGE)}`;
    const store = new ActiveReportStore(fakeTabsApi(reportUrl).tabs);

    store.start();

    await vi.waitFor(() =>
      expect(store.getSnapshot()).toEqual({
        status: ActiveTabStatus.Report,
        report: {
          tabId: 7,
          url: reportUrl,
          activePins: [DEATH_BADGE],
          view: { tab: 'damage-taken', ability: '1304424' },
        },
      }),
    );
  });

  it('follows in-page navigation and notifies subscribers', async () => {
    const { tabs, navigate } = fakeTabsApi('https://www.warcraftlogs.com/reports/AbC123');
    const store = new ActiveReportStore(tabs);
    const listener = vi.fn();
    store.subscribe(listener);
    store.start();
    await vi.waitFor(() => expect(store.getSnapshot().status).toBe(ActiveTabStatus.Report));

    navigate(`https://www.warcraftlogs.com/reports/AbC123?pins=${encodeURIComponent(joinPins([DEATH_BADGE]))}`);

    await vi.waitFor(() => {
      const state = store.getSnapshot();
      expect(state.status === ActiveTabStatus.Report && state.report.activePins).toEqual([DEATH_BADGE]);
    });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('reports tabs that do not show a report', async () => {
    const store = new ActiveReportStore(fakeTabsApi('https://www.warcraftlogs.com/zone/rankings/44').tabs);

    store.start();

    await vi.waitFor(() => expect(store.getSnapshot().status).toBe(ActiveTabStatus.NoReport));
  });
});
