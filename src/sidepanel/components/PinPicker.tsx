import { useId, useMemo, useState } from 'react';
import type { SavedPin, SavedPinId } from '../../library/librarySchema';
import { EMPTY_FILTER, filterPins } from '../../library/librarySearch';

type PinPickerProps = {
  readonly pins: readonly SavedPin[];
  readonly selectedPinIds: readonly SavedPinId[];
  readonly error: string | undefined;
  readonly onToggle: (pinId: SavedPinId) => void;
};

export function PinPicker({ pins, selectedPinIds, error, onToggle }: PinPickerProps) {
  const pickerId = useId();
  const [searchText, setSearchText] = useState('');
  const visiblePins = useMemo(
    () => filterPins(pins, { ...EMPTY_FILTER, text: searchText }),
    [pins, searchText],
  );

  return (
    <fieldset className="pin-picker">
      <legend className="field-label">
        Pins in this set ({selectedPinIds.length} selected)
      </legend>
      <input
        className="input"
        type="search"
        placeholder="Filter pins"
        aria-label="Filter pins"
        value={searchText}
        onChange={(event) => setSearchText(event.target.value)}
      />
      <ul className="pin-picker-list">
        {visiblePins.map((pin) => (
          <li key={pin.id}>
            <label className="pin-picker-item" htmlFor={`${pickerId}-${pin.id}`}>
              <input
                id={`${pickerId}-${pin.id}`}
                type="checkbox"
                checked={selectedPinIds.includes(pin.id)}
                onChange={() => onToggle(pin.id)}
              />
              <span>{pin.name}</span>
            </label>
          </li>
        ))}
      </ul>
      {pins.length === 0 && <p className="field-hint">Save some pins first, then group them here.</p>}
      {error !== undefined && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
