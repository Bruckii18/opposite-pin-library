import { ApplyMode } from '../../apply/applyPlan';
import type { ApplyTarget } from '../../library/applyTargets';
import { usePinApplication } from '../pinApplication/PinApplicationContext';

const APPLY_TITLE = 'Apply these pins to this report';
const REPLACE_TITLE = 'Replace the pins that are active on this report with these';
const ADD_TO_CURRENT_TITLE = 'Keep the pins that are active on this report and add these';

type ApplyButtonsProps = {
  readonly target: ApplyTarget;
};

export function ApplyButtons({ target }: ApplyButtonsProps) {
  const { canApply, hasActivePins, applyTarget } = usePinApplication();
  const isDisabled = !canApply || target.pins.length === 0;
  return (
    <>
      <button
        type="button"
        className="button button--accent button--small"
        disabled={isDisabled}
        title={hasActivePins ? REPLACE_TITLE : APPLY_TITLE}
        onClick={() => void applyTarget(target, ApplyMode.Replace)}
      >
        Apply
      </button>
      {hasActivePins && (
        <button
          type="button"
          className="button button--ghost button--small"
          disabled={isDisabled}
          aria-label="Add to current"
          title={ADD_TO_CURRENT_TITLE}
          onClick={() => void applyTarget(target, ApplyMode.Add)}
        >
          Add
        </button>
      )}
    </>
  );
}
