import { useMemo } from 'react';
import { findPinByPinString } from '../../library/libraryOperations';
import type { SavedPin } from '../../library/librarySchema';
import { withOccurrenceKeys } from '../../shared/occurrenceKeys';
import type { PinString } from '../../wcl/pinString';
import type { ViewParams } from '../../wcl/viewParams';
import { useActivePinSaving } from '../hooks/useActivePinSaving';
import { ActivePinRow } from './ActivePinRow';
import { SaveActivePinsAsSetForm } from './SaveActivePinsAsSetForm';

type ActiveReportPinsProps = {
  readonly activePins: readonly PinString[];
  readonly activeView: ViewParams;
  readonly libraryPins: readonly SavedPin[];
};

export function ActiveReportPins({ activePins, activeView, libraryPins }: ActiveReportPinsProps) {
  const saving = useActivePinSaving(activePins);
  const keyedPins = useMemo(() => withOccurrenceKeys(activePins), [activePins]);
  const hasActivePins = activePins.length > 0;

  return (
    <section className="section" aria-label="Pins on this report">
      <div className="section-header">
        <h2 className="section-title">This report</h2>
        <span className="count">{activePins.length} active</span>
      </div>
      {!hasActivePins && (
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
            savedPin={findPinByPinString(libraryPins, pin)}
            isSaveFormOpen={saving.pinBeingSaved === pin}
            onStartSaving={() => saving.startSavingPin(pin)}
            onSave={saving.savePin}
            onCancelSaving={saving.cancelSavingPin}
          />
        ))}
      </ul>
      {hasActivePins && !saving.isSavingAsSet && (
        <button type="button" className="button button--small" onClick={saving.startSavingAsSet}>
          Save all as set
        </button>
      )}
      {saving.isSavingAsSet && (
        <SaveActivePinsAsSetForm
          pinCount={activePins.length}
          activeView={activeView}
          onSubmit={saving.saveAsSet}
          onCancel={saving.cancelSavingAsSet}
        />
      )}
    </section>
  );
}
