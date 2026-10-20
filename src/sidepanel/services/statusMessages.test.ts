import { describe, expect, it } from 'vitest';
import { ApplyMode } from '../../apply/applyPlan';
import { ApplyPinsOutcome } from '../../apply/applyPins';
import { ApplyStrategyName } from '../../apply/applyStrategy';
import type { ViewSelection } from '../../library/applyTargets';
import { setExportFileName, libraryExportFileName } from './exportFileNames';
import { describeApplyResult, describeImportSummary } from './statusMessages';

const NO_SAVED_VIEW: ViewSelection = { viewParams: null, conflictWinnerName: null };

describe('describeApplyResult', () => {
  it('mentions the dialog fallback so users notice when the URL route broke', () => {
    const message = describeApplyResult(
      {
        outcome: ApplyPinsOutcome.Applied,
        strategy: ApplyStrategyName.PinDialog,
        activePinCount: 3,
        isViewChanged: false,
      },
      ApplyMode.Add,
      NO_SAVED_VIEW,
    );

    expect(message).toBe('Added the pins to the current ones through the Add Pin dialog. Active pins: 3.');
  });

  it('describes replacing and reloading', () => {
    expect(
      describeApplyResult(
        {
          outcome: ApplyPinsOutcome.Applied,
          strategy: ApplyStrategyName.PageRouter,
          activePinCount: 1,
          isViewChanged: false,
        },
        ApplyMode.Replace,
        NO_SAVED_VIEW,
      ),
    ).toBe('Applied the pins. Active pins: 1.');
    expect(
      describeApplyResult(
        {
          outcome: ApplyPinsOutcome.Reloading,
          strategy: ApplyStrategyName.PageReload,
          activePinCount: 2,
          isViewChanged: false,
        },
        ApplyMode.Add,
        NO_SAVED_VIEW,
      ),
    ).toBe('Reloading the report with the new pins. Active pins: 2.');
  });

  it('mentions a view switch and which saved view won a conflict', () => {
    const message = describeApplyResult(
      {
        outcome: ApplyPinsOutcome.Applied,
        strategy: ApplyStrategyName.PageRouter,
        activePinCount: 2,
        isViewChanged: true,
      },
      ApplyMode.Replace,
      { viewParams: { type: 'casts' }, conflictWinnerName: 'Mythic review' },
    );

    expect(message).toBe(
      'Applied the pins and switched to the saved view. Active pins: 2. ' +
        'The saved views differ, so the last one ("Mythic review") was used.',
    );
  });
});

describe('describeImportSummary', () => {
  it('summarizes added and already existing entries', () => {
    expect(describeImportSummary({ addedPins: 1, reusedPins: 2, addedSets: 0, skippedSets: 1 })).toBe(
      'Imported 1 new pin and 0 new sets. 2 pins already existed. 1 set already existed.',
    );
  });
});

describe('export file names', () => {
  it('uses the export date and a slug of the set name', () => {
    expect(libraryExportFileName('2026-10-16T12:00:00.000Z')).toBe('opposite-pins-library-2026-10-16.json');
    expect(setExportFileName('Mythic Prog: Night 1!', '2026-10-16T12:00:00.000Z')).toBe(
      'opposite-pins-set-mythic-prog-night-1-2026-10-16.json',
    );
  });
});
