import type { LibraryEntry } from '../../library/librarySchema';
import { useActiveTab } from '../hooks/useActiveTab';
import { ActiveTabStatus } from '../services/activeReportStore';
import { ActiveReportPins } from './ActiveReportPins';

type ActiveReportSectionProps = {
  readonly libraryEntries: readonly LibraryEntry[];
};

export function ActiveReportSection({ libraryEntries }: ActiveReportSectionProps) {
  const activeTab = useActiveTab();
  switch (activeTab.status) {
    case ActiveTabStatus.Checking:
      return null;
    case ActiveTabStatus.NoReport:
      return (
        <section className="report-band report-band--hint" aria-label="Pins on this report">
          <p className="muted">
            Open a Warcraft Logs report to save its pins or apply pins from your library.
          </p>
        </section>
      );
    case ActiveTabStatus.Report:
      return (
        <ActiveReportPins
          key={activeTab.report.tabId}
          activePins={activeTab.report.activePins}
          activeView={activeTab.report.view}
          libraryEntries={libraryEntries}
        />
      );
  }
}
