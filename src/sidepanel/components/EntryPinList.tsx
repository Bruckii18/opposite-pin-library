import { withOccurrenceKeys } from '../../shared/occurrenceKeys';
import type { PinString } from '../../wcl/pinString';
import { PinSummary } from './PinSummary';

type EntryPinListProps = {
  readonly pins: readonly PinString[];
  readonly namesByPin?: ReadonlyMap<PinString, string> | undefined;
  readonly maxVisible?: number | undefined;
};

export function EntryPinList({ pins, namesByPin, maxVisible = pins.length }: EntryPinListProps) {
  const visiblePins = withOccurrenceKeys(pins.slice(0, maxVisible));
  const hiddenCount = pins.length - visiblePins.length;
  return (
    <ul className="entry-pins">
      {visiblePins.map(({ key, value: pin }) => (
        <li key={key}>
          <PinSummary pinString={pin} label={namesByPin?.get(pin)} />
        </li>
      ))}
      {hiddenCount > 0 && <li className="entry-pins-more">+ {hiddenCount} more</li>}
    </ul>
  );
}
