import { ApplyMode } from '../../apply/applyPlan';
import type { PinString } from '../../wcl/pinString';
import { usePinApplication } from '../pinApplication/PinApplicationContext';

type ApplyButtonsProps = {
  readonly pins: readonly PinString[];
};

export function ApplyButtons({ pins }: ApplyButtonsProps) {
  const { canApply, applyPins } = usePinApplication();
  const isDisabled = !canApply || pins.length === 0;
  return (
    <>
      <button
        type="button"
        className="button button--primary button--small"
        disabled={isDisabled}
        title="Apply on top of the pins that are already active on this report"
        onClick={() => void applyPins(pins, ApplyMode.Add)}
      >
        Apply
      </button>
      <button
        type="button"
        className="button button--small"
        disabled={isDisabled}
        title="Remove the current pins on this report and apply these instead"
        onClick={() => void applyPins(pins, ApplyMode.Replace)}
      >
        Replace Current
      </button>
    </>
  );
}
