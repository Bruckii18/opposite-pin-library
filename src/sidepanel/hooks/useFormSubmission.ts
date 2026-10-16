import { useState, type FormEvent } from 'react';
import type { FieldErrors, FormValidation } from '../forms/formValidation';

export interface FormSubmission<Field extends string> {
  readonly errors: FieldErrors<Field>;
  readonly isSaving: boolean;
  submit(event: FormEvent<HTMLFormElement>): void;
}

export function useFormSubmission<Values, Output, Field extends string>(
  values: Values,
  validate: (values: Values) => FormValidation<Output, Field>,
  onSubmit: (output: Output) => Promise<void>,
): FormSubmission<Field> {
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [isSaving, setIsSaving] = useState(false);

  const saveValidOutput = async (output: Output): Promise<void> => {
    setIsSaving(true);
    await onSubmit(output);
    setIsSaving(false);
  };

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const validation = validate(values);
    setErrors(validation.valid ? {} : validation.errors);
    if (validation.valid) {
      void saveValidOutput(validation.output);
    }
  };

  return { errors, isSaving, submit };
}
