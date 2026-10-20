import type { EntryDraft } from '../../library/libraryOperations';
import type { LibraryEntry } from '../../library/librarySchema';
import type { PinString } from '../../wcl/pinString';
import type { ViewParams } from '../../wcl/viewParams';
import { entryFormValuesForActivePins } from '../forms/entryFormModel';
import { CAPTURE_VIEW_TOGGLE_LABEL } from '../forms/viewFormModel';
import { EntryForm } from './EntryForm';
import { PinSummary } from './PinSummary';

type ActivePinRowProps = {
  readonly pin: PinString;
  readonly activeView: ViewParams;
  readonly savedEntry: LibraryEntry | undefined;
  readonly containingEntries: readonly LibraryEntry[];
  readonly isSaveFormOpen: boolean;
  readonly onStartSaving: () => void;
  readonly onSave: (draft: EntryDraft) => Promise<void>;
  readonly onCancelSaving: () => void;
};

export function ActivePinRow({
  pin,
  activeView,
  savedEntry,
  containingEntries,
  isSaveFormOpen,
  onStartSaving,
  onSave,
  onCancelSaving,
}: ActivePinRowProps) {
  const [firstContainingEntry] = containingEntries;
  return (
    <li className="active-pin">
      <div className="active-pin-row">
        <PinSummary pinString={pin} />
        {savedEntry !== undefined ? (
          <span className="saved-badge" title={`Saved as “${savedEntry.name}”`}>
            ✓ Saved
          </span>
        ) : (
          <div className="active-pin-actions">
            {firstContainingEntry !== undefined && (
              <span
                className="in-group-badge"
                title={`Part of ${containingEntries.map((entry) => `“${entry.name}”`).join(', ')}`}
              >
                In {firstContainingEntry.name}
                {containingEntries.length > 1 && ` +${containingEntries.length - 1}`}
              </span>
            )}
            <button
              type="button"
              className="button button--accent button--small"
              onClick={onStartSaving}
              disabled={isSaveFormOpen}
            >
              Save
            </button>
          </div>
        )}
      </div>
      {isSaveFormOpen && (
        <EntryForm
          title="Save this pin"
          initialValues={entryFormValuesForActivePins([pin], activeView)}
          canEditPins={false}
          viewToggleLabel={CAPTURE_VIEW_TOGGLE_LABEL}
          submitLabel="Save"
          onSubmit={onSave}
          onCancel={onCancelSaving}
        />
      )}
    </li>
  );
}
