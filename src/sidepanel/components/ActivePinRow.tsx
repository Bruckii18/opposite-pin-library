import type { PinDraft } from '../../library/libraryOperations';
import type { SavedPin } from '../../library/librarySchema';
import type { PinString } from '../../wcl/pinString';
import type { ViewParams } from '../../wcl/viewParams';
import { pinFormValuesForActivePin } from '../forms/pinFormModel';
import { CAPTURE_VIEW_TOGGLE_LABEL } from '../forms/viewFormModel';
import { PinForm } from './PinForm';
import { PinSummary } from './PinSummary';

type ActivePinRowProps = {
  readonly pin: PinString;
  readonly activeView: ViewParams;
  readonly savedPin: SavedPin | undefined;
  readonly isSaveFormOpen: boolean;
  readonly onStartSaving: () => void;
  readonly onSave: (draft: PinDraft) => Promise<void>;
  readonly onCancelSaving: () => void;
};

export function ActivePinRow({
  pin,
  activeView,
  savedPin,
  isSaveFormOpen,
  onStartSaving,
  onSave,
  onCancelSaving,
}: ActivePinRowProps) {
  return (
    <li className="active-pin">
      <div className="active-pin-row">
        <PinSummary pinString={pin} />
        {savedPin === undefined ? (
          <button
            type="button"
            className="button button--small"
            onClick={onStartSaving}
            disabled={isSaveFormOpen}
          >
            Save
          </button>
        ) : (
          <span className="saved-badge" title={`Saved as “${savedPin.name}”`}>
            ✓ Saved
          </span>
        )}
      </div>
      {isSaveFormOpen && (
        <PinForm
          title="Save this pin"
          initialValues={pinFormValuesForActivePin(pin, activeView)}
          canEditPinString={false}
          viewToggleLabel={CAPTURE_VIEW_TOGGLE_LABEL}
          submitLabel="Save pin"
          onSubmit={onSave}
          onCancel={onCancelSaving}
        />
      )}
    </li>
  );
}
