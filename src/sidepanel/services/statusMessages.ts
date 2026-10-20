import { ApplyMode } from '../../apply/applyPlan';
import { ApplyPinsOutcome, type ApplyPinsResult } from '../../apply/applyPins';
import { ApplyStrategyName } from '../../apply/applyStrategy';
import type { ViewSelection } from '../../library/applyTargets';
import type { ImportSummary } from '../../library/libraryTransfer';

const APPLIED_TEXT_BY_MODE: Record<ApplyMode, string> = {
  [ApplyMode.Add]: 'Added the pins to the current ones',
  [ApplyMode.Replace]: 'Applied the pins',
};

export function describeApplyResult(
  result: ApplyPinsResult,
  mode: ApplyMode,
  viewSelection: ViewSelection,
): string {
  return [describeOutcome(result, mode), describeViewConflict(viewSelection)]
    .filter((sentence) => sentence !== '')
    .join(' ');
}

export function describeImportSummary(summary: ImportSummary): string {
  return [
    `Imported ${countLabel(summary.addedPins, 'new pin')} and ${countLabel(summary.addedSets, 'new set')}.`,
    summary.reusedPins > 0 ? `${countLabel(summary.reusedPins, 'pin')} already existed.` : '',
    summary.skippedSets > 0 ? `${countLabel(summary.skippedSets, 'set')} already existed.` : '',
  ]
    .filter((sentence) => sentence !== '')
    .join(' ');
}

function describeOutcome(result: ApplyPinsResult, mode: ApplyMode): string {
  const activePinsText = `Active pins: ${result.activePinCount}.`;
  switch (result.outcome) {
    case ApplyPinsOutcome.Unchanged:
      return 'Nothing to change, those pins are already active.';
    case ApplyPinsOutcome.Reloading:
      return result.isViewChanged
        ? `Reloading the report with the new pins and the saved view. ${activePinsText}`
        : `Reloading the report with the new pins. ${activePinsText}`;
    case ApplyPinsOutcome.Applied:
      return `${APPLIED_TEXT_BY_MODE[mode]}${describeAppliedExtra(result)}. ${activePinsText}`;
  }
}

function describeAppliedExtra(result: ApplyPinsResult): string {
  if (result.strategy === ApplyStrategyName.PinDialog) {
    return ' through the Add Pin dialog';
  }
  return result.isViewChanged ? ' and switched to the saved view' : '';
}

function describeViewConflict({ conflictWinnerName }: ViewSelection): string {
  return conflictWinnerName === null
    ? ''
    : `The saved views differ, so the last one ("${conflictWinnerName}") was used.`;
}

function countLabel(count: number, singularNoun: string): string {
  return `${count} ${singularNoun}${count === 1 ? '' : 's'}`;
}
