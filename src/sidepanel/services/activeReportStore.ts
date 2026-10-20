import { logError } from '../../shared/errors';
import type { PinString } from '../../wcl/pinString';
import { parseWclReportUrl, readActivePins, readViewParams } from '../../wcl/reportUrl';
import type { ViewParams } from '../../wcl/viewParams';

export interface ActiveReport {
  readonly tabId: number;
  readonly url: string;
  readonly activePins: readonly PinString[];
  readonly view: ViewParams;
}

export const ActiveTabStatus = {
  Checking: 'checking',
  NoReport: 'no-report',
  Report: 'report',
} as const;

export type ActiveTabState =
  | { readonly status: typeof ActiveTabStatus.Checking }
  | { readonly status: typeof ActiveTabStatus.NoReport }
  | { readonly status: typeof ActiveTabStatus.Report; readonly report: ActiveReport };

export type TabsApi = Pick<typeof chrome.tabs, 'query' | 'onActivated' | 'onUpdated'>;

const CHECKING: ActiveTabState = { status: ActiveTabStatus.Checking };
const NO_REPORT: ActiveTabState = { status: ActiveTabStatus.NoReport };

export class ActiveReportStore {
  private state: ActiveTabState = CHECKING;
  private readonly listeners = new Set<() => void>();

  constructor(private readonly tabs: TabsApi) {}

  start(): () => void {
    const refresh = (): void => this.refresh();
    const refreshOnUrlChange = (
      _tabId: number,
      changeInfo: chrome.tabs.OnUpdatedInfo,
      tab: chrome.tabs.Tab,
    ): void => {
      if (tab.active && changeInfo.url !== undefined) {
        this.refresh();
      }
    };
    this.tabs.onActivated.addListener(refresh);
    this.tabs.onUpdated.addListener(refreshOnUrlChange);
    this.refresh();
    return () => {
      this.tabs.onActivated.removeListener(refresh);
      this.tabs.onUpdated.removeListener(refreshOnUrlChange);
    };
  }

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  readonly getSnapshot = (): ActiveTabState => this.state;

  private refresh(): void {
    this.tabs.query({ active: true, currentWindow: true }).then(
      ([activeTab]) => this.setState(toActiveTabState(activeTab)),
      (error: unknown) => logError('Could not read the active tab.', error),
    );
  }

  private setState(nextState: ActiveTabState): void {
    if (isSameTabState(this.state, nextState)) {
      return;
    }
    this.state = nextState;
    this.listeners.forEach((listener) => listener());
  }
}

function toActiveTabState(tab: chrome.tabs.Tab | undefined): ActiveTabState {
  const reportUrl = parseWclReportUrl(tab?.url);
  if (tab?.id === undefined || reportUrl === null) {
    return NO_REPORT;
  }
  return {
    status: ActiveTabStatus.Report,
    report: {
      tabId: tab.id,
      url: reportUrl.href,
      activePins: readActivePins(reportUrl),
      view: readViewParams(reportUrl),
    },
  };
}

function isSameTabState(current: ActiveTabState, next: ActiveTabState): boolean {
  if (current.status !== ActiveTabStatus.Report || next.status !== ActiveTabStatus.Report) {
    return current.status === next.status;
  }
  return current.report.tabId === next.report.tabId && current.report.url === next.report.url;
}
