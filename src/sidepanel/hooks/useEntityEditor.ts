import { useState } from 'react';
import { CLOSED_EDITOR, CREATING_EDITOR, editing, type EditorState } from '../forms/editorState';
import { useStatus } from '../status/StatusContext';

interface NamedDraft {
  readonly name: string;
}

export interface EntityPersistence<Id, Draft extends NamedDraft> {
  create(draft: Draft): Promise<void>;
  update(id: Id, draft: Draft): Promise<void>;
}

export interface EntityEditor<Id, Draft extends NamedDraft> {
  readonly editor: EditorState<Id>;
  startCreating(): void;
  startEditing(id: Id): void;
  closeEditor(): void;
  saveNew(draft: Draft): Promise<void>;
  saveEdit(id: Id): (draft: Draft) => Promise<void>;
}

export function useEntityEditor<Id, Draft extends NamedDraft>(
  persistence: EntityPersistence<Id, Draft>,
): EntityEditor<Id, Draft> {
  const { trackTask } = useStatus();
  const [editor, setEditor] = useState<EditorState<Id>>(CLOSED_EDITOR);

  const closeEditor = (): void => setEditor(CLOSED_EDITOR);

  const persistAndClose = async (persist: () => Promise<void>, name: string): Promise<void> => {
    const isSaved = await trackTask(persist, () => `Saved "${name}".`);
    if (isSaved) {
      closeEditor();
    }
  };

  return {
    editor,
    startCreating: () => setEditor(CREATING_EDITOR),
    startEditing: (id) => setEditor(editing(id)),
    closeEditor,
    saveNew: (draft) => persistAndClose(() => persistence.create(draft), draft.name),
    saveEdit: (id) => (draft) => persistAndClose(() => persistence.update(id, draft), draft.name),
  };
}
