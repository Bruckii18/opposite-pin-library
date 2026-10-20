import type { PinDraft } from '../../library/libraryOperations';
import type { SavedPin } from '../../library/librarySchema';
import { suggestPinName } from '../../library/pinNaming';
import { formatTags, parseTags } from '../../library/tags';
import { interpretPinInput } from '../../wcl/pinInput';
import type { PinString } from '../../wcl/pinString';
import type { ViewParams } from '../../wcl/viewParams';
import type { FormValidation } from './formValidation';
import {
  EMPTY_VIEW_FORM_VALUES,
  validateViewForm,
  viewFormValuesForCapture,
  viewFormValuesFromSaved,
  type ViewFormValues,
} from './viewFormModel';

export interface PinFormValues {
  readonly pinInput: string;
  readonly name: string;
  readonly description: string;
  readonly tags: string;
  readonly view: ViewFormValues;
}

export type PinFormField = keyof PinFormValues;
export type PinTextField = Exclude<PinFormField, 'view'>;

export const EMPTY_PIN_FORM_VALUES: PinFormValues = {
  pinInput: '',
  name: '',
  description: '',
  tags: '',
  view: EMPTY_VIEW_FORM_VALUES,
};

export function pinFormValuesFromPin(pin: SavedPin): PinFormValues {
  return {
    pinInput: pin.pinString,
    name: pin.name,
    description: pin.description,
    tags: formatTags(pin.tags),
    view: viewFormValuesFromSaved(pin.viewParams),
  };
}

export function pinFormValuesForActivePin(pinString: PinString, currentView: ViewParams): PinFormValues {
  return { ...EMPTY_PIN_FORM_VALUES, pinInput: pinString, view: viewFormValuesForCapture(currentView) };
}

export function validatePinForm(values: PinFormValues): FormValidation<PinDraft, PinFormField> {
  const pinInput = interpretPinInput(values.pinInput);
  const view = validateViewForm(values.view);
  if (!pinInput.valid || !view.valid) {
    return {
      valid: false,
      errors: {
        ...(pinInput.valid ? {} : { pinInput: pinInput.reason }),
        ...(view.valid ? {} : { view: view.error }),
      },
    };
  }
  return {
    valid: true,
    output: {
      pinString: pinInput.pinString,
      name: values.name.trim() || suggestPinName(pinInput.pinString),
      description: values.description.trim(),
      tags: parseTags(values.tags),
      viewParams: view.viewParams,
    },
  };
}
