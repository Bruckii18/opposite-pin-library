import { useMemo, useState } from 'react';
import type { PinSetDraft } from '../../library/libraryOperations';
import type { PinLibrary, PinSetId } from '../../library/librarySchema';
import { collectTags, EMPTY_FILTER, filterSets } from '../../library/librarySearch';
import { isCreating, isEditing } from '../forms/editorState';
import { EMPTY_SET_FORM_VALUES, setFormValuesFromSet } from '../forms/setFormModel';
import { useEntityEditor } from '../hooks/useEntityEditor';
import { useLibraryActions } from '../hooks/useLibrary';
import { EmptyState } from './EmptyState';
import { LibraryFilterBar } from './LibraryFilterBar';
import { SetForm } from './SetForm';
import { SetListItem } from './SetListItem';

type SetsTabProps = {
  readonly library: PinLibrary;
};

export function SetsTab({ library }: SetsTabProps) {
  const { saveSet, updateSet } = useLibraryActions();
  const setEditor = useEntityEditor<PinSetId, PinSetDraft>({ create: saveSet, update: updateSet });
  const [filter, setFilter] = useState(EMPTY_FILTER);
  const visibleSets = useMemo(() => filterSets(library.sets, filter), [library.sets, filter]);
  const availableTags = useMemo(() => collectTags(library.sets), [library.sets]);

  return (
    <section aria-label="Pin sets">
      <LibraryFilterBar
        filter={filter}
        availableTags={availableTags}
        searchLabel="Search sets"
        createLabel="New set"
        onFilterChange={setFilter}
        onCreate={setEditor.startCreating}
      />
      {isCreating(setEditor.editor) && (
        <SetForm
          title="New set"
          initialValues={EMPTY_SET_FORM_VALUES}
          libraryPins={library.pins}
          submitLabel="Save set"
          onSubmit={setEditor.saveNew}
          onCancel={setEditor.closeEditor}
        />
      )}
      {library.sets.length === 0 && (
        <EmptyState title="No sets yet">
          Group pins you use together, then apply them with one click.
        </EmptyState>
      )}
      {library.sets.length > 0 && visibleSets.length === 0 && (
        <EmptyState title="No matching sets">Try another search term or tag.</EmptyState>
      )}
      <ul className="list">
        {visibleSets.map((set) =>
          isEditing(setEditor.editor, set.id) ? (
            <li key={set.id} className="list-item list-item--editing">
              <SetForm
                title={`Edit “${set.name}”`}
                initialValues={setFormValuesFromSet(set)}
                libraryPins={library.pins}
                submitLabel="Save changes"
                onSubmit={setEditor.saveEdit(set.id)}
                onCancel={setEditor.closeEditor}
              />
            </li>
          ) : (
            <SetListItem
              key={set.id}
              library={library}
              set={set}
              onEdit={() => setEditor.startEditing(set.id)}
            />
          ),
        )}
      </ul>
    </section>
  );
}
