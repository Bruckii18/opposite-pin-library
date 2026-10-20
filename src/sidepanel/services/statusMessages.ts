import { ApplyMode } from '../../apply/applyPlan';
import { ApplyPinsOutcome, type ApplyPinsResult } from '../../apply/applyPins';
import { ApplyStrategyName } from '../../apply/applyStrategy';
import type { ImportSummary } from '../../library/libraryTransfer';

const APPLIED_TEXT_BY_MODE: Record<ApplyMode, string> = {
  [ApplyMode.Add]: 'Added the pins to the current ones',
  [ApplyMode.Replace]: 'Applied the pins',
};

export function describeApplyResult(result: ApplyPinsResult, mode: ApplyMode): string {
  return describeOutcome(result, mode);
}

export function describeImportSummary({ addedEntries, skippedEntries }: ImportSummary): string {
  const added = `Imported ${countLabel(addedEntries, 'new entry', 'new entries')}.`;
  return skippedEntries === 0
    ? added
    : `${added} ${countLabel(skippedEntries, 'entry', 'entries')} already existed.`;
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

function countLabel(count: number, singularNoun: string, pluralNoun: string): string {
  return `${count} ${count === 1 ? singularNoun : pluralNoun}`;
}
