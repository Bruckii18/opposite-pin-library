import { useState } from 'react';
import type { PinSetDraft } from '../../library/libraryOperations';
import type { SavedPin, SavedPinId } from '../../library/librarySchema';
import {
  togglePinSelection,
  validateSetForm,
  type SetDetailsTextField,
  type SetFormValues,
} from '../forms/setFormModel';
import { SAVED_VIEW_TOGGLE_LABEL, type ViewFormValues } from '../forms/viewFormModel';
import { useFormSubmission } from '../hooks/useFormSubmission';
import { FormActions } from './FormActions';
import { PinPicker } from './PinPicker';
import { SetDetailsFields } from './SetDetailsFields';
import { ViewParamsFields } from './ViewParamsFields';

type SetFormProps = {
  readonly title: string;
  readonly initialValues: SetFormValues;
  readonly libraryPins: readonly SavedPin[];
  readonly submitLabel: string;
  readonly onSubmit: (draft: PinSetDraft) => Promise<void>;
  readonly onCancel: () => void;
};

export function SetForm({
  title,
  initialValues,
  libraryPins,
  submitLabel,
  onSubmit,
  onCancel,
}: SetFormProps) {
  const [values, setValues] = useState(initialValues);
  const { errors, isSaving, submit } = useFormSubmission(values, validateSetForm, onSubmit);

  const updateDetail = (field: SetDetailsTextField, value: string): void =>
    setValues((current) => ({ ...current, [field]: value }));

  const updateView = (view: ViewFormValues): void => setValues((current) => ({ ...current, view }));

  const togglePin = (pinId: SavedPinId): void =>
    setValues((current) => ({ ...current, pinIds: togglePinSelection(current.pinIds, pinId) }));

  return (
    <form className="form" onSubmit={submit} aria-label={title}>
      <p className="form-title">{title}</p>
      <SetDetailsFields values={values} errors={errors} onFieldChange={updateDetail} />
      <PinPicker
        pins={libraryPins}
        selectedPinIds={values.pinIds}
        error={errors.pinIds}
        onToggle={togglePin}
      />
      <ViewParamsFields
        toggleLabel={SAVED_VIEW_TOGGLE_LABEL}
        values={values.view}
        error={errors.view}
        onChange={updateView}
      />
      <FormActions submitLabel={submitLabel} isSaving={isSaving} onCancel={onCancel} />
    </form>
  );
}
