import { useId, useState, type ChangeEvent } from 'react';
import type { PinDraft } from '../../library/libraryOperations';
import { suggestPinName } from '../../library/pinNaming';
import { interpretPinInput, PinInputKind } from '../../wcl/pinInput';
import { validatePinForm, type PinFormField, type PinFormValues } from '../forms/pinFormModel';
import { useFormSubmission } from '../hooks/useFormSubmission';
import { FormActions } from './FormActions';
import { FormField } from './FormField';
import { PinSummary } from './PinSummary';

const PIN_INPUT_HINT = 'Paste a string from WCL\'s Copy Pin button, or a filter expression like type = "cast".';
const FILTER_EXPRESSION_HINT = 'Recognized as a filter expression. It is saved as a Filter pin, like WCL\'s Filter Expression box does.';

type PinFormProps = {
  readonly title: string;
  readonly initialValues: PinFormValues;
  readonly canEditPinString: boolean;
  readonly submitLabel: string;
  readonly onSubmit: (draft: PinDraft) => Promise<void>;
  readonly onCancel: () => void;
};

export function PinForm({
  title,
  initialValues,
  canEditPinString,
  submitLabel,
  onSubmit,
  onCancel,
}: PinFormProps) {
  const fieldIdPrefix = useId();
  const [values, setValues] = useState(initialValues);
  const { errors, isSaving, submit } = useFormSubmission(values, validatePinForm, onSubmit);
  const pinInput = interpretPinInput(values.pinInput);
  const isFilterExpression = pinInput.valid && pinInput.kind === PinInputKind.FilterExpression;

  const updateField =
    (field: PinFormField) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((current) => ({ ...current, [field]: event.target.value }));

  return (
    <form className="form" onSubmit={submit} aria-label={title}>
      <p className="form-title">{title}</p>
      {canEditPinString && (
        <FormField
          label="Pin string or filter expression"
          htmlFor={`${fieldIdPrefix}-pin`}
          error={errors.pinInput}
          hint={isFilterExpression ? FILTER_EXPRESSION_HINT : PIN_INPUT_HINT}
        >
          <textarea
            id={`${fieldIdPrefix}-pin`}
            className="input input--mono"
            rows={3}
            value={values.pinInput}
            onChange={updateField('pinInput')}
            spellCheck={false}
            autoFocus
          />
        </FormField>
      )}
      {pinInput.valid && <PinSummary pinString={pinInput.pinString} />}
      <FormField label="Name" htmlFor={`${fieldIdPrefix}-name`}>
        <input
          id={`${fieldIdPrefix}-name`}
          className="input"
          value={values.name}
          placeholder={pinInput.valid ? suggestPinName(pinInput.pinString) : ''}
          onChange={updateField('name')}
          autoFocus={!canEditPinString}
        />
      </FormField>
      <FormField label="Description" htmlFor={`${fieldIdPrefix}-description`}>
        <textarea
          id={`${fieldIdPrefix}-description`}
          className="input"
          rows={2}
          value={values.description}
          onChange={updateField('description')}
        />
      </FormField>
      <FormField
        label="Tags"
        htmlFor={`${fieldIdPrefix}-tags`}
        hint="Comma separated, e.g. healer, mythic"
      >
        <input
          id={`${fieldIdPrefix}-tags`}
          className="input"
          value={values.tags}
          onChange={updateField('tags')}
        />
      </FormField>
      <FormActions submitLabel={submitLabel} isSaving={isSaving} onCancel={onCancel} />
    </form>
  );
}
