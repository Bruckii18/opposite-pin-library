export type EditorState<Id> =
  | { readonly kind: 'closed' }
  | { readonly kind: 'creating' }
  | { readonly kind: 'editing'; readonly id: Id };

export const CLOSED_EDITOR = { kind: 'closed' } as const;
export const CREATING_EDITOR = { kind: 'creating' } as const;

export function editing<Id>(id: Id): EditorState<Id> {
  return { kind: 'editing', id };
}

export function isEditing<Id>(editor: EditorState<Id>, id: Id): boolean {
  return editor.kind === 'editing' && editor.id === id;
}

export function isCreating<Id>(editor: EditorState<Id>): boolean {
  return editor.kind === 'creating';
}
