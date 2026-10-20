import type { PinSetDetails, PinSetDraft } from '../../library/libraryOperations';
import type { PinSet, SavedPinId } from '../../library/librarySchema';
import { formatTags, parseTags } from '../../library/tags';
import type { ViewParams } from '../../wcl/viewParams';
import type { FieldErrors, FormValidation } from './formValidation';
import {
  EMPTY_VIEW_FORM_VALUES,
  validateViewForm,
  viewFormValuesForCapture,
  viewFormValuesFromSaved,
  type ViewFormValues,
} from './viewFormModel';

export interface SetDetailsValues {
  readonly name: string;
  readonly description: string;
  readonly tags: string;
  readonly view: ViewFormValues;
}

export type SetDetailsTextField = Exclude<keyof SetDetailsValues, 'view'>;

export interface SetFormValues extends SetDetailsValues {
  readonly pinIds: readonly SavedPinId[];
}

export type SetFormField = keyof SetFormValues;
export type SetFormErrors = FieldErrors<SetFormField>;

export const EMPTY_SET_DETAILS_VALUES: SetDetailsValues = {
  name: '',
  description: '',
  tags: '',
  view: EMPTY_VIEW_FORM_VALUES,
};

export const EMPTY_SET_FORM_VALUES: SetFormValues = { ...EMPTY_SET_DETAILS_VALUES, pinIds: [] };

export function setFormValuesFromSet(set: PinSet): SetFormValues {
  return {
    name: set.name,
    description: set.description,
    tags: formatTags(set.tags),
    pinIds: set.pinIds,
    view: viewFormValuesFromSaved(set.viewParams),
  };
}

export function setDetailsValuesForActiveReport(currentView: ViewParams): SetDetailsValues {
  return { ...EMPTY_SET_DETAILS_VALUES, view: viewFormValuesForCapture(currentView) };
}

export function validateSetDetails(
  values: SetDetailsValues,
): FormValidation<PinSetDetails, SetFormField> {
  const name = values.name.trim();
  const view = validateViewForm(values.view);
  if (name === '' || !view.valid) {
    return {
      valid: false,
      errors: {
        ...(name === '' ? { name: 'Give the set a name.' } : {}),
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
      viewParams: view.viewParams,
    },
  };
}

export function validateSetForm(values: SetFormValues): FormValidation<PinSetDraft, SetFormField> {
  const detailsValidation = validateSetDetails(values);
  const hasPins = values.pinIds.length > 0;
  if (detailsValidation.valid && hasPins) {
    return { valid: true, output: { ...detailsValidation.output, pinIds: values.pinIds } };
  }
  return {
    valid: false,
    errors: {
      ...(detailsValidation.valid ? {} : detailsValidation.errors),
      ...(hasPins ? {} : { pinIds: 'Pick at least one pin.' }),
    },
  };
}

export function togglePinSelection(
  pinIds: readonly SavedPinId[],
  pinId: SavedPinId,
): readonly SavedPinId[] {
  return pinIds.includes(pinId) ? pinIds.filter((id) => id !== pinId) : [...pinIds, pinId];
}
