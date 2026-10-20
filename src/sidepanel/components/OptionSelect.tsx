import type { ViewOption } from '../forms/viewFormModel';

type OptionSelectProps = {
  readonly id: string;
  readonly options: readonly ViewOption<string>[];
  readonly value: string;
  readonly onChange: (value: string) => void;
};

export function OptionSelect({ id, options, value, onChange }: OptionSelectProps) {
  return (
    <select id={id} className="input" value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
