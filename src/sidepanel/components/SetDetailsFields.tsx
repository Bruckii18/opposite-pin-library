import { useId } from 'react';
import type { SetDetailsTextField, SetDetailsValues, SetFormErrors } from '../forms/setFormModel';
import { FormField } from './FormField';

type SetDetailsFieldsProps = {
  readonly values: SetDetailsValues;
  readonly errors: SetFormErrors;
  readonly onFieldChange: (field: SetDetailsTextField, value: string) => void;
};

export function SetDetailsFields({ values, errors, onFieldChange }: SetDetailsFieldsProps) {
  const fieldIdPrefix = useId();
  return (
    <>
      <FormField label="Set name" htmlFor={`${fieldIdPrefix}-name`} error={errors.name}>
        <input
          id={`${fieldIdPrefix}-name`}
          className="input"
          value={values.name}
          onChange={(event) => onFieldChange('name', event.target.value)}
          autoFocus
        />
      </FormField>
      <FormField label="Description" htmlFor={`${fieldIdPrefix}-description`}>
        <textarea
          id={`${fieldIdPrefix}-description`}
          className="input"
          rows={2}
          value={values.description}
          onChange={(event) => onFieldChange('description', event.target.value)}
        />
      </FormField>
      <FormField
        label="Tags"
        htmlFor={`${fieldIdPrefix}-tags`}
        hint="Comma separated, e.g. progression, healer"
      >
        <input
          id={`${fieldIdPrefix}-tags`}
          className="input"
          value={values.tags}
          onChange={(event) => onFieldChange('tags', event.target.value)}
        />
      </FormField>
    </>
  );
}
