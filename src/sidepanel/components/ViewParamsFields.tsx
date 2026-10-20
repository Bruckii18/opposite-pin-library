import { useId } from 'react';
import { VIEW_QUERY_PARAMS, type ViewQueryParam } from '../../wcl/wclContract';
import { VIEW_PARAM_FIELDS, type ViewFormValues } from '../forms/viewFormModel';
import { FormField } from './FormField';

const VIEW_HINT =
  'Applying sets these next to the pins and keeps fight, boss and the other report settings. Empty fields are removed from the URL.';

type ViewParamsFieldsProps = {
  readonly toggleLabel: string;
  readonly values: ViewFormValues;
  readonly error: string | undefined;
  readonly onChange: (values: ViewFormValues) => void;
};

export function ViewParamsFields({ toggleLabel, values, error, onChange }: ViewParamsFieldsProps) {
  const fieldIdPrefix = useId();

  const updateParam = (param: ViewQueryParam, value: string): void =>
    onChange({ ...values, params: { ...values.params, [param]: value } });

  return (
    <fieldset className="view-fields">
      <label className="checkbox-field" htmlFor={`${fieldIdPrefix}-enabled`}>
        <input
          id={`${fieldIdPrefix}-enabled`}
          type="checkbox"
          checked={values.isEnabled}
          onChange={(event) => onChange({ ...values, isEnabled: event.target.checked })}
        />
        <span>{toggleLabel}</span>
      </label>
      {values.isEnabled && (
        <>
          <p className="field-hint">{VIEW_HINT}</p>
          {VIEW_QUERY_PARAMS.map((param) => (
            <FormField
              key={param}
              label={VIEW_PARAM_FIELDS[param].label}
              htmlFor={`${fieldIdPrefix}-${param}`}
              hint={VIEW_PARAM_FIELDS[param].hint}
            >
              <input
                id={`${fieldIdPrefix}-${param}`}
                className="input input--mono"
                value={values.params[param] ?? ''}
                inputMode={VIEW_PARAM_FIELDS[param].isNumeric ? 'numeric' : 'text'}
                spellCheck={false}
                onChange={(event) => updateParam(param, event.target.value)}
              />
            </FormField>
          ))}
          {error !== undefined && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
        </>
      )}
    </fieldset>
  );
}
