export type FieldErrors<Field extends string> = Partial<Record<Field, string>>;

export type FormValidation<Output, Field extends string> =
  | { readonly valid: true; readonly output: Output }
  | { readonly valid: false; readonly errors: FieldErrors<Field> };
