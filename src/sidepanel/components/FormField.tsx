import type { ReactNode } from 'react';

type FormFieldProps = {
  readonly label: string;
  readonly htmlFor: string;
  readonly error?: string | undefined;
  readonly hint?: string | undefined;
  readonly children: ReactNode;
};

export function FormField({ label, htmlFor, error, hint, children }: FormFieldProps) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error !== undefined && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      {error === undefined && hint !== undefined && <p className="field-hint">{hint}</p>}
    </div>
  );
}
