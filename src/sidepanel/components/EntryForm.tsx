import { useId, useState, type ChangeEvent } from 'react';
import type { EntryDraft } from '../../library/libraryOperations';
import {
  interpretPinsInput,
  suggestEntryName,
  validateEntryForm,
  type EntryFormValues,
  type EntryTextField,
} from '../forms/entryFormModel';
import type { ViewFormValues } from '../forms/viewFormModel';
import { useFormSubmission } from '../hooks/useFormSubmission';
import { EntryPinList } from './EntryPinList';
import { FormActions } from './FormActions';
import { FormField } from './FormField';
import { TagsField } from './TagsField';
import { ViewParamsFields } from './ViewParamsFields';

const PINS_HINT =
  'One per line: a string from WCL\'s Copy Pin button, or a filter expression like type = "cast". Filter expressions are saved as Filter pins.';
const TAGS_HINT = 'Comma separated, e.g. healer, mythic';

type EntryFormProps = {
  readonly title: string;
  readonly initialValues: EntryFormValues;
  readonly canEditPins: boolean;
  readonly viewToggleLabel: string;
  readonly submitLabel: string;
  readonly onSubmit: (draft: EntryDraft) => Promise<void>;
  readonly onCancel: () => void;
};

export function EntryForm({
  title,
  initialValues,
  canEditPins,
  viewToggleLabel,
  submitLabel,
  onSubmit,
  onCancel,
}: EntryFormProps) {
  const fieldIdPrefix = useId();
  const [values, setValues] = useState(initialValues);
  const { errors, isSaving, submit } = useFormSubmission(values, validateEntryForm, onSubmit);
  const pins = interpretPinsInput(values.pinsInput);

  const updateField =
    (field: EntryTextField) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((current) => ({ ...current, [field]: event.target.value }));

  const updateTags = (tags: string): void => setValues((current) => ({ ...current, tags }));

  const updateView = (view: ViewFormValues): void => setValues((current) => ({ ...current, view }));

  return (
    <form className="form" onSubmit={submit} aria-label={title}>
      <p className="form-title">{title}</p>
      {canEditPins && (
        <FormField label="Pins" htmlFor={`${fieldIdPrefix}-pins`} error={errors.pinsInput} hint={PINS_HINT}>
          <textarea
            id={`${fieldIdPrefix}-pins`}
            className="input input--mono"
            rows={3}
            value={values.pinsInput}
            onChange={updateField('pinsInput')}
            spellCheck={false}
            autoFocus
          />
        </FormField>
      )}
      {pins.valid && <EntryPinList pins={pins.pins} />}
      <FormField label="Name" htmlFor={`${fieldIdPrefix}-name`} error={errors.name}>
        <input
          id={`${fieldIdPrefix}-name`}
          className="input"
          value={values.name}
          placeholder={suggestEntryName(values.pinsInput)}
          onChange={updateField('name')}
          autoFocus={!canEditPins}
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
      <TagsField value={values.tags} hint={TAGS_HINT} onChange={updateTags} />
      <ViewParamsFields
        toggleLabel={viewToggleLabel}
        values={values.view}
        error={errors.view}
        onChange={updateView}
      />
      <FormActions submitLabel={submitLabel} isSaving={isSaving} onCancel={onCancel} />
    </form>
  );
}
