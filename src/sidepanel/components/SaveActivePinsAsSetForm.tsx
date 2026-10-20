import { useState } from 'react';
import type { PinSetDetails } from '../../library/libraryOperations';
import type { ViewParams } from '../../wcl/viewParams';
import {
  setDetailsValuesForActiveReport,
  validateSetDetails,
  type SetDetailsTextField,
} from '../forms/setFormModel';
import { CAPTURE_VIEW_TOGGLE_LABEL, type ViewFormValues } from '../forms/viewFormModel';
import { useFormSubmission } from '../hooks/useFormSubmission';
import { FormActions } from './FormActions';
import { SetDetailsFields } from './SetDetailsFields';
import { ViewParamsFields } from './ViewParamsFields';

type SaveActivePinsAsSetFormProps = {
  readonly pinCount: number;
  readonly activeView: ViewParams;
  readonly onSubmit: (details: PinSetDetails) => Promise<void>;
  readonly onCancel: () => void;
};

export function SaveActivePinsAsSetForm({
  pinCount,
  activeView,
  onSubmit,
  onCancel,
}: SaveActivePinsAsSetFormProps) {
  const [values, setValues] = useState(() => setDetailsValuesForActiveReport(activeView));
  const { errors, isSaving, submit } = useFormSubmission(values, validateSetDetails, onSubmit);

  const updateDetail = (field: SetDetailsTextField, value: string): void =>
    setValues((current) => ({ ...current, [field]: value }));

  const updateView = (view: ViewFormValues): void => setValues((current) => ({ ...current, view }));

  return (
    <form className="form" onSubmit={submit} aria-label="Save active pins as a set">
      <p className="form-title">
        Save {pinCount} active {pinCount === 1 ? 'pin' : 'pins'} as a set
      </p>
      <p className="field-hint">Pins that are not in your library yet are saved as well.</p>
      <SetDetailsFields values={values} errors={errors} onFieldChange={updateDetail} />
      <ViewParamsFields
        toggleLabel={CAPTURE_VIEW_TOGGLE_LABEL}
        values={values.view}
        error={errors.view}
        onChange={updateView}
      />
      <FormActions submitLabel="Save set" isSaving={isSaving} onCancel={onCancel} />
    </form>
  );
}
