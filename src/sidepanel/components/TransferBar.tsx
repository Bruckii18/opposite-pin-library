import { useRef, type ChangeEvent } from 'react';
import type { PinLibrary } from '../../library/librarySchema';
import { PanelSurface } from '../../display/panelPage';
import { useLibraryActions } from '../hooks/useLibrary';
import { usePanelServices } from '../PanelServicesContext';
import { downloadLibraryExport } from '../services/exportDownloads';
import { openLibraryInTab } from '../services/panelWindow';
import { describeImportSummary } from '../services/statusMessages';
import { useStatus } from '../status/StatusContext';

type TransferBarProps = {
  readonly library: PinLibrary;
};

const JSON_FILE_TYPES = 'application/json,.json';
const POPUP_IMPORT_HINT = 'Opens the library in a tab, because popups close as soon as a file dialog opens.';

export function TransferBar({ library }: TransferBarProps) {
  const { importFile } = useLibraryActions();
  const { surface } = usePanelServices();
  const { trackTask } = useStatus();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPopup = surface === PanelSurface.Popup;

  const startImport = (): void => {
    if (isPopup) {
      void trackTask(openLibraryInTab);
      return;
    }
    fileInputRef.current?.click();
  };

  const importChosenFile = (event: ChangeEvent<HTMLInputElement>): void => {
    const chosenFile = event.target.files?.[0];
    event.target.value = '';
    if (chosenFile !== undefined) {
      void trackTask(async () => importFile(await chosenFile.text()), describeImportSummary);
    }
  };

  return (
    <footer className="panel-footer">
      <button
        type="button"
        className="button button--ghost button--small"
        title={isPopup ? POPUP_IMPORT_HINT : undefined}
        onClick={startImport}
      >
        Import JSON
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept={JSON_FILE_TYPES}
        hidden
        onChange={importChosenFile}
      />
      <button
        type="button"
        className="button button--ghost button--small"
        onClick={() =>
          void trackTask(async () => downloadLibraryExport(library), () => 'Library exported.')
        }
      >
        Export library
      </button>
    </footer>
  );
}
