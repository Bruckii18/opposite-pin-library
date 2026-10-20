import { describe, expect, it } from 'vitest';
import { ApplyMode } from '../../apply/applyPlan';
import { ApplyPinsOutcome } from '../../apply/applyPins';
import { ApplyStrategyName } from '../../apply/applyStrategy';
import { entryExportFileName, libraryExportFileName } from './exportFileNames';
import { describeApplyResult, describeImportSummary } from './statusMessages';

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
      ),
    ).toBe('Reloading the report with the new pins. Active pins: 2.');
  });

  it('mentions a switch to the saved view', () => {
    const message = describeApplyResult(
      {
        outcome: ApplyPinsOutcome.Applied,
        strategy: ApplyStrategyName.PageRouter,
        activePinCount: 2,
        isViewChanged: true,
      },
      ApplyMode.Replace,
    );

    expect(message).toBe('Applied the pins and switched to the saved view. Active pins: 2.');
  });
});

describe('describeImportSummary', () => {
  it('summarizes added and already existing entries', () => {
    expect(describeImportSummary({ addedEntries: 1, skippedEntries: 2 })).toBe(
      'Imported 1 new entry. 2 entries already existed.',
    );
    expect(describeImportSummary({ addedEntries: 3, skippedEntries: 0 })).toBe('Imported 3 new entries.');
  });
});

describe('export file names', () => {
  it('uses the export date and a slug of the entry name', () => {
    expect(libraryExportFileName('2026-10-16T12:00:00.000Z')).toBe('opposite-pins-library-2026-10-16.json');
    expect(entryExportFileName('Mythic Prog: Night 1!', '2026-10-16T12:00:00.000Z')).toBe(
      'opposite-pins-mythic-prog-night-1-2026-10-16.json',
    );
  });
});
