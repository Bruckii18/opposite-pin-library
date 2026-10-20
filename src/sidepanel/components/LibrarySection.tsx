import { useMemo, useState } from 'react';
import { namePinsBySinglePinEntries, type EntryDraft } from '../../library/libraryOperations';
import type { LibraryEntryId, PinLibrary } from '../../library/librarySchema';
import { collectTags, EMPTY_FILTER, filterEntries } from '../../library/librarySearch';
import { isCreating, isEditing } from '../forms/editorState';
import { EMPTY_ENTRY_FORM_VALUES, entryFormValuesFromEntry } from '../forms/entryFormModel';
import { SAVED_VIEW_TOGGLE_LABEL } from '../forms/viewFormModel';
import { useEntityEditor } from '../hooks/useEntityEditor';
import { useLibraryActions } from '../hooks/useLibrary';
import { EmptyState } from './EmptyState';
import { EntryForm } from './EntryForm';
import { EntryListItem } from './EntryListItem';
import { LibraryFilterBar } from './LibraryFilterBar';

type LibrarySectionProps = {
  readonly library: PinLibrary;
};

export function LibrarySection({ library }: LibrarySectionProps) {
  const { saveEntry, updateEntry } = useLibraryActions();
  const entryEditor = useEntityEditor<LibraryEntryId, EntryDraft>({ create: saveEntry, update: updateEntry });
  const [filter, setFilter] = useState(EMPTY_FILTER);
  const { entries } = library;
  const visibleEntries = useMemo(() => filterEntries(entries, filter), [entries, filter]);
  const availableTags = useMemo(() => collectTags(entries), [entries]);
  const namesByPin = useMemo(() => namePinsBySinglePinEntries(entries), [entries]);

  return (
    <section className="library" aria-label="Library">
      <div className="section-header">
        <h2 className="section-title">Library</h2>
        <span className="count">{entries.length}</span>
      </div>
      <LibraryFilterBar
        filter={filter}
        availableTags={availableTags}
        searchLabel="Search library"
        createLabel="Add pins"
        onFilterChange={setFilter}
        onCreate={entryEditor.startCreating}
      />
      {isCreating(entryEditor.editor) && (
        <EntryForm
          title="Add pins"
          initialValues={EMPTY_ENTRY_FORM_VALUES}
          canEditPins
          viewToggleLabel={SAVED_VIEW_TOGGLE_LABEL}
          submitLabel="Save"
          onSubmit={entryEditor.saveNew}
          onCancel={entryEditor.closeEditor}
        />
      )}
      {entries.length === 0 && (
        <EmptyState title="Nothing saved yet">
          Save the active pins of a report above, or paste pin strings with “Add pins”.
        </EmptyState>
      )}
      {entries.length > 0 && visibleEntries.length === 0 && (
        <EmptyState title="No matches">Try another search term or tag.</EmptyState>
      )}
      <ul className="list">
        {visibleEntries.map((entry) =>
          isEditing(entryEditor.editor, entry.id) ? (
            <li key={entry.id} className="list-item list-item--editing">
              <EntryForm
                title={`Edit “${entry.name}”`}
                initialValues={entryFormValuesFromEntry(entry)}
                canEditPins
                viewToggleLabel={SAVED_VIEW_TOGGLE_LABEL}
                submitLabel="Save changes"
                onSubmit={entryEditor.saveEdit(entry.id)}
                onCancel={entryEditor.closeEditor}
              />
            </li>
          ) : (
            <EntryListItem
              key={entry.id}
              entry={entry}
              namesByPin={namesByPin}
              onEdit={() => entryEditor.startEditing(entry.id)}
            />
          ),
        )}
      </ul>
    </section>
  );
}
