import { LibraryStatus } from '../library/libraryStore';
import { ActiveReportSection } from './components/ActiveReportSection';
import { LibrarySection } from './components/LibrarySection';
import { PanelHeader } from './components/PanelHeader';
import { StatusBar } from './components/StatusBar';
import { TransferBar } from './components/TransferBar';
import { useLibraryState } from './hooks/useLibrary';
import { usePanelServices } from './PanelServicesContext';

export function App() {
  const libraryState = useLibraryState();
  const { surface } = usePanelServices();
  return (
    <div className={`panel panel--${surface}`}>
      <PanelHeader />
      <main className="panel-body">
        {libraryState.status === LibraryStatus.Loading && <p className="muted">Loading your pins…</p>}
        {libraryState.status === LibraryStatus.Failed && (
          <div className="section section--error" role="alert">
            <p className="section-title">Your pin library could not be loaded.</p>
            <p>{libraryState.message}</p>
            <p className="muted">Nothing was changed. Fix or remove the stored data before editing.</p>
          </div>
        )}
        {libraryState.status === LibraryStatus.Ready && (
          <>
            <ActiveReportSection libraryEntries={libraryState.library.entries} />
            <LibrarySection library={libraryState.library} />
          </>
        )}
      </main>
      {libraryState.status === LibraryStatus.Ready && <TransferBar library={libraryState.library} />}
      <StatusBar />
    </div>
  );
}
