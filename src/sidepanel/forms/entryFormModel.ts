import type { EntryDraft } from '../../library/libraryOperations';
import type { LibraryEntry } from '../../library/librarySchema';
import { suggestPinName } from '../../library/pinNaming';
import { formatTags, parseTags } from '../../library/tags';
import { interpretPinInput } from '../../wcl/pinInput';
import type { PinString } from '../../wcl/pinString';
import type { ViewParams } from '../../wcl/viewParams';
import { PIN_SEPARATOR } from '../../wcl/wclContract';
import type { FormValidation } from './formValidation';
import {
  EMPTY_VIEW_FORM_VALUES,
  validateViewForm,
  viewFormValuesForCapture,
  viewFormValuesFromSaved,
  type ViewFormValues,
} from './viewFormModel';

export interface EntryFormValues {
  readonly pinsInput: string;
  readonly name: string;
  readonly description: string;
  readonly tags: string;
  readonly view: ViewFormValues;
}

export type EntryFormField = keyof EntryFormValues;
export type EntryTextField = Exclude<EntryFormField, 'view'>;

export type PinsInputInterpretation =
  | { readonly valid: true; readonly pins: readonly PinString[] }
  | { readonly valid: false; readonly reason: string };

interface PinsInputPart {
  readonly text: string;
  readonly lineNumber: number;
}

const LINE_BREAK = /\r?\n/;
const PINS_INPUT_LINE_SEPARATOR = '\n';
const NO_PINS_REASON = 'Paste at least one pin string or filter expression.';
const MISSING_NAME_REASON = 'Give these pins a name.';

export const EMPTY_ENTRY_FORM_VALUES: EntryFormValues = {
  pinsInput: '',
  name: '',
  description: '',
  tags: '',
  view: EMPTY_VIEW_FORM_VALUES,
};

export function entryFormValuesFromEntry(entry: LibraryEntry): EntryFormValues {
  return {
    pinsInput: formatPinsInput(entry.pins),
    name: entry.name,
    description: entry.description,
    tags: formatTags(entry.tags),
    view: viewFormValuesFromSaved(entry.viewParams),
  };
}

export function entryFormValuesForActivePins(
  pins: readonly PinString[],
  currentView: ViewParams,
): EntryFormValues {
  return { ...EMPTY_ENTRY_FORM_VALUES, pinsInput: formatPinsInput(pins), view: viewFormValuesForCapture(currentView) };
}

export function interpretPinsInput(pinsInput: string): PinsInputInterpretation {
  const parts = splitPinsInput(pinsInput);
  const hasSeveralLines = new Set(parts.map((part) => part.lineNumber)).size > 1;
  const pins: PinString[] = [];
  for (const part of parts) {
    const interpretation = interpretPinInput(part.text);
    if (!interpretation.valid) {
      const reason = hasSeveralLines ? `Line ${part.lineNumber}: ${interpretation.reason}` : interpretation.reason;
      return { valid: false, reason };
    }
    pins.push(interpretation.pinString);
  }
  return pins.length === 0 ? { valid: false, reason: NO_PINS_REASON } : { valid: true, pins: [...new Set(pins)] };
}

export function suggestEntryName(pinsInput: string): string {
  return suggestedName(interpretPinsInput(pinsInput));
}

export function validateEntryForm(values: EntryFormValues): FormValidation<EntryDraft, EntryFormField> {
  const pins = interpretPinsInput(values.pinsInput);
  const view = validateViewForm(values.view);
  const name = values.name.trim() || suggestedName(pins);
  if (!pins.valid || !view.valid || name === '') {
    return {
      valid: false,
      errors: {
        ...(pins.valid ? {} : { pinsInput: pins.reason }),
        ...(pins.valid && name === '' ? { name: MISSING_NAME_REASON } : {}),
        ...(view.valid ? {} : { view: view.error }),
      },
    };
  }
  return {
    valid: true,
    output: {
      name,
      description: values.description.trim(),
      tags: parseTags(values.tags),
      pins: pins.pins,
      viewParams: view.viewParams,
    },
  };
}

function splitPinsInput(pinsInput: string): PinsInputPart[] {
  return pinsInput.split(LINE_BREAK).flatMap((line, index) =>
    line
      .split(PIN_SEPARATOR)
      .filter((text) => text.trim() !== '')
      .map((text) => ({ text, lineNumber: index + 1 })),
  );
}

function suggestedName(pins: PinsInputInterpretation): string {
  const onlyPin = pins.valid && pins.pins.length === 1 ? pins.pins[0] : undefined;
  return onlyPin === undefined ? '' : suggestPinName(onlyPin);
}

function formatPinsInput(pins: readonly PinString[]): string {
  return pins.join(PINS_INPUT_LINE_SEPARATOR);
}
