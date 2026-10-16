import type { PinDraft } from '../../library/libraryOperations';
import type { SavedPin } from '../../library/librarySchema';
import { suggestPinName } from '../../library/pinNaming';
import { formatTags, parseTags } from '../../library/tags';
import { interpretPinInput } from '../../wcl/pinInput';
import type { PinString } from '../../wcl/pinString';
import type { FormValidation } from './formValidation';

export interface PinFormValues {
  readonly pinInput: string;
  readonly name: string;
  readonly description: string;
  readonly tags: string;
}

export type PinFormField = keyof PinFormValues;

export const EMPTY_PIN_FORM_VALUES: PinFormValues = {
  pinInput: '',
  name: '',
  description: '',
  tags: '',
};

export function pinFormValuesFromPin(pin: SavedPin): PinFormValues {
  return {
    pinInput: pin.pinString,
    name: pin.name,
    description: pin.description,
    tags: formatTags(pin.tags),
  };
}

export function pinFormValuesForPinString(pinString: PinString): PinFormValues {
  return { ...EMPTY_PIN_FORM_VALUES, pinInput: pinString };
}

export function validatePinForm(values: PinFormValues): FormValidation<PinDraft, PinFormField> {
  const pinInput = interpretPinInput(values.pinInput);
  if (!pinInput.valid) {
    return { valid: false, errors: { pinInput: pinInput.reason } };
  }
  return {
    valid: true,
    output: {
      pinString: pinInput.pinString,
      name: values.name.trim() || suggestPinName(pinInput.pinString),
      description: values.description.trim(),
      tags: parseTags(values.tags),
    },
  };
}
