import logoUrl from '../../../assets/icon/logo.svg';
import { PanelSurface } from '../../display/panelPage';
import { usePanelServices } from '../PanelServicesContext';
import { closePanel } from '../services/panelWindow';
import { useStatus } from '../status/StatusContext';

const SIDE_PANEL_HINT =
  'Use the side panel instead of this popup (Chrome, Edge, Brave). It takes effect on the next click on the toolbar icon. Arc only supports the popup.';

export function PanelHeader() {
  const { surface, displayMode } = usePanelServices();
  const { trackTask } = useStatus();

  const switchToSidePanel = (): void =>
    void trackTask(async () => {
      await displayMode.useSidePanel();
      window.close();
    });

  return (
    <header className="panel-header">
      <h1 className="panel-title">
        <img className="panel-logo" src={logoUrl} alt="" />
        Opposite Pin Library
      </h1>
      <div className="panel-header-actions">
        {surface === PanelSurface.Popup && (
          <button
            type="button"
            className="button button--ghost button--small"
            title={SIDE_PANEL_HINT}
            onClick={switchToSidePanel}
          >
            Side panel
          </button>
        )}
        {surface !== PanelSurface.Tab && (
          <button
            type="button"
            className="icon-button"
            aria-label="Close"
            title="Close"
            onClick={() => void trackTask(() => closePanel(surface))}
          >
            ×
          </button>
        )}
      </div>
    </header>
  );
}
