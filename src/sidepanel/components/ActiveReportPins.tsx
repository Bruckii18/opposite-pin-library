import { useMemo } from 'react';
import { findGroupsContainingPin, findSinglePinEntry } from '../../library/libraryOperations';
import type { LibraryEntry } from '../../library/librarySchema';
import { withOccurrenceKeys } from '../../shared/occurrenceKeys';
import type { PinString } from '../../wcl/pinString';
import type { ViewParams } from '../../wcl/viewParams';
import { entryFormValuesForActivePins } from '../forms/entryFormModel';
import { CAPTURE_VIEW_TOGGLE_LABEL } from '../forms/viewFormModel';
import { useActivePinSaving } from '../hooks/useActivePinSaving';
import { ActivePinRow } from './ActivePinRow';
import { EntryForm } from './EntryForm';

type ActiveReportPinsProps = {
  readonly activePins: readonly PinString[];
  readonly activeView: ViewParams;
  readonly libraryEntries: readonly LibraryEntry[];
};

export function ActiveReportPins({ activePins, activeView, libraryEntries }: ActiveReportPinsProps) {
  const saving = useActivePinSaving();
  const keyedPins = useMemo(() => withOccurrenceKeys(activePins), [activePins]);
  const canSaveAll = activePins.length > 1;

  return (
    <section className="report-band" aria-label="Pins on this report">
      <div className="section-header">
        <h2 className="section-title">This report</h2>
        <span className="count">{activePins.length} active</span>
      </div>
      {activePins.length === 0 && (
        <p className="muted">
          No pins are active. Add pins with WCL’s Queries tab, then save them here.
        </p>
      )}
      <ul className="active-pin-list">
        {keyedPins.map(({ key, value: pin }) => (
          <ActivePinRow
            key={key}
            pin={pin}
            activeView={activeView}
            savedEntry={findSinglePinEntry(libraryEntries, pin)}
            containingEntries={findGroupsContainingPin(libraryEntries, pin)}
            isSaveFormOpen={saving.pinBeingSaved === pin}
            onStartSaving={() => saving.startSavingPin(pin)}
            onSave={saving.savePin}
            onCancelSaving={saving.cancelSavingPin}
          />
        ))}
      </ul>
      {canSaveAll && !saving.isSavingAll && (
        <button type="button" className="button button--small" onClick={saving.startSavingAll}>
          Save all together
        </button>
      )}
      {saving.isSavingAll && (
        <EntryForm
          title={`Save ${activePins.length} active pins together`}
          initialValues={entryFormValuesForActivePins(activePins, activeView)}
          canEditPins={false}
          viewToggleLabel={CAPTURE_VIEW_TOGGLE_LABEL}
          submitLabel="Save"
          onSubmit={saving.saveAll}
          onCancel={saving.cancelSavingAll}
        />
      )}
    </section>
  );
}
