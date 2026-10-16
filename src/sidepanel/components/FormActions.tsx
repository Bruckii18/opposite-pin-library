type FormActionsProps = {
  readonly submitLabel: string;
  readonly isSaving: boolean;
  readonly onCancel: () => void;
};

export function FormActions({ submitLabel, isSaving, onCancel }: FormActionsProps) {
  return (
    <div className="form-actions">
      <button type="button" className="button button--small" onClick={onCancel}>
        Cancel
      </button>
      <button type="submit" className="button button--primary button--small" disabled={isSaving}>
        {submitLabel}
      </button>
    </div>
  );
}
