import { ApplyMode } from '../../apply/applyPlan';
import { ApplyPinsOutcome, type ApplyPinsResult } from '../../apply/applyPins';
import { ApplyStrategyName } from '../../apply/applyStrategy';
import type { ImportSummary } from '../../library/libraryTransfer';

const APPLIED_TEXT_BY_MODE: Record<ApplyMode, string> = {
  [ApplyMode.Add]: 'Applied the pins',
  [ApplyMode.Replace]: 'Replaced the current pins',
};

export function describeApplyResult(result: ApplyPinsResult, mode: ApplyMode): string {
  const activePinsText = `Active pins: ${result.activePinCount}.`;
  switch (result.outcome) {
    case ApplyPinsOutcome.Unchanged:
      return 'Nothing to change, those pins are already active.';
    case ApplyPinsOutcome.Reloading:
      return `Reloading the report with the new pins. ${activePinsText}`;
    case ApplyPinsOutcome.Applied:
      return result.strategy === ApplyStrategyName.PinDialog
        ? `${APPLIED_TEXT_BY_MODE[mode]} through the Add Pin dialog. ${activePinsText}`
        : `${APPLIED_TEXT_BY_MODE[mode]}. ${activePinsText}`;
  }
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

function countLabel(count: number, singularNoun: string): string {
  return `${count} ${singularNoun}${count === 1 ? '' : 's'}`;
}
