import type { WclHostility } from '../../wcl/wclContract';
import { HOSTILITY_OPTIONS, ViewFieldLabel } from '../forms/viewFormModel';

type HostilityToggleProps = {
  readonly name: string;
  readonly value: WclHostility;
  readonly onChange: (hostility: WclHostility) => void;
};

export function HostilityToggle({ name, value, onChange }: HostilityToggleProps) {
  return (
    <fieldset className="field segmented-field">
      <legend className="field-label">{ViewFieldLabel.Hostility}</legend>
      <div className="segmented">
        {HOSTILITY_OPTIONS.map((option) => (
          <label key={option.value} className="segmented-option">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
