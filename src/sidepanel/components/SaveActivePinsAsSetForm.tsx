import { useState } from 'react';
import type { PinSetDetails } from '../../library/libraryOperations';
import {
  EMPTY_SET_DETAILS_VALUES,
  validateSetDetails,
  type SetDetailsValues,
} from '../forms/setFormModel';
import { useFormSubmission } from '../hooks/useFormSubmission';
import { FormActions } from './FormActions';
import { SetDetailsFields } from './SetDetailsFields';

type SaveActivePinsAsSetFormProps = {
  readonly pinCount: number;
  readonly onSubmit: (details: PinSetDetails) => Promise<void>;
  readonly onCancel: () => void;
};

export function SaveActivePinsAsSetForm({
  pinCount,
  onSubmit,
  onCancel,
}: SaveActivePinsAsSetFormProps) {
  const [values, setValues] = useState<SetDetailsValues>(EMPTY_SET_DETAILS_VALUES);
  const { errors, isSaving, submit } = useFormSubmission(values, validateSetDetails, onSubmit);

  const updateDetail = (field: keyof SetDetailsValues, value: string): void =>
    setValues((current) => ({ ...current, [field]: value }));

  return (
    <form className="form" onSubmit={submit} aria-label="Save active pins as a set">
      <p className="form-title">
        Save {pinCount} active {pinCount === 1 ? 'pin' : 'pins'} as a set
      </p>
      <p className="field-hint">Pins that are not in your library yet are saved as well.</p>
      <SetDetailsFields values={values} errors={errors} onFieldChange={updateDetail} />
      <FormActions submitLabel="Save set" isSaving={isSaving} onCancel={onCancel} />
    </form>
  );
}
