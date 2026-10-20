import { useId } from 'react';
import {
  LAYOUT_OPTIONS,
  layoutFromOption,
  NO_PARAM_OPTION_VALUE,
  TAB_OPTIONS,
  tabFromOption,
  ViewFieldLabel,
  type ViewFormValues,
} from '../forms/viewFormModel';
import { FormField } from './FormField';
import { HostilityToggle } from './HostilityToggle';
import { OptionSelect } from './OptionSelect';

const VIEW_HINT =
  'Fight, boss, source and the other report settings stay as they are. Default and Tables leave the param out of the URL.';
const ABILITY_PLACEHOLDER = 'All abilities';

type ViewParamsFieldsProps = {
  readonly toggleLabel: string;
  readonly values: ViewFormValues;
  readonly error: string | undefined;
  readonly onChange: (values: ViewFormValues) => void;
};

export function ViewParamsFields({ toggleLabel, values, error, onChange }: ViewParamsFieldsProps) {
  const fieldIdPrefix = useId();

  const update = (changes: Partial<ViewFormValues>): void => onChange({ ...values, ...changes });

  return (
    <fieldset className="view-fields">
      <label className="checkbox-field" htmlFor={`${fieldIdPrefix}-enabled`}>
        <input
          id={`${fieldIdPrefix}-enabled`}
          type="checkbox"
          checked={values.isEnabled}
          onChange={(event) => update({ isEnabled: event.target.checked })}
        />
        <span>{toggleLabel}</span>
      </label>
      {values.isEnabled && (
        <>
          <div className="view-grid">
            <FormField label={ViewFieldLabel.Tab} htmlFor={`${fieldIdPrefix}-tab`}>
              <OptionSelect
                id={`${fieldIdPrefix}-tab`}
                options={TAB_OPTIONS}
                value={values.tab ?? NO_PARAM_OPTION_VALUE}
                onChange={(value) => update({ tab: tabFromOption(value) })}
              />
            </FormField>
            <FormField label={ViewFieldLabel.Layout} htmlFor={`${fieldIdPrefix}-layout`}>
              <OptionSelect
                id={`${fieldIdPrefix}-layout`}
                options={LAYOUT_OPTIONS}
                value={values.layout ?? NO_PARAM_OPTION_VALUE}
                onChange={(value) => update({ layout: layoutFromOption(value) })}
              />
            </FormField>
            <HostilityToggle
              name={`${fieldIdPrefix}-hostility`}
              value={values.hostility}
              onChange={(hostility) => update({ hostility })}
            />
            <FormField label={ViewFieldLabel.Ability} htmlFor={`${fieldIdPrefix}-ability`}>
              <input
                id={`${fieldIdPrefix}-ability`}
                className="input input--mono"
                value={values.ability}
                placeholder={ABILITY_PLACEHOLDER}
                inputMode="numeric"
                spellCheck={false}
                onChange={(event) => update({ ability: event.target.value })}
              />
            </FormField>
          </div>
          <p className="field-hint">{VIEW_HINT}</p>
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
