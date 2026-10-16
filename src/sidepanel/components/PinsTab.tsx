import { useMemo, useState } from 'react';
import type { PinDraft } from '../../library/libraryOperations';
import type { SavedPin, SavedPinId } from '../../library/librarySchema';
import { collectTags, EMPTY_FILTER, filterPins } from '../../library/librarySearch';
import { isCreating, isEditing } from '../forms/editorState';
import { EMPTY_PIN_FORM_VALUES, pinFormValuesFromPin } from '../forms/pinFormModel';
import { useEntityEditor } from '../hooks/useEntityEditor';
import { useLibraryActions } from '../hooks/useLibrary';
import { EmptyState } from './EmptyState';
import { LibraryFilterBar } from './LibraryFilterBar';
import { PinForm } from './PinForm';
import { PinListItem } from './PinListItem';

type PinsTabProps = {
  readonly pins: readonly SavedPin[];
};

export function PinsTab({ pins }: PinsTabProps) {
  const { savePin, updatePin } = useLibraryActions();
  const pinEditor = useEntityEditor<SavedPinId, PinDraft>({ create: savePin, update: updatePin });
  const [filter, setFilter] = useState(EMPTY_FILTER);
  const visiblePins = useMemo(() => filterPins(pins, filter), [pins, filter]);
  const availableTags = useMemo(() => collectTags(pins), [pins]);

  return (
    <section aria-label="Saved pins">
      <LibraryFilterBar
        filter={filter}
        availableTags={availableTags}
        searchLabel="Search pins"
        createLabel="New pin"
        onFilterChange={setFilter}
        onCreate={pinEditor.startCreating}
      />
      {isCreating(pinEditor.editor) && (
        <PinForm
          title="New pin"
          initialValues={EMPTY_PIN_FORM_VALUES}
          canEditPinString
          submitLabel="Save pin"
          onSubmit={pinEditor.saveNew}
          onCancel={pinEditor.closeEditor}
        />
      )}
      {pins.length === 0 && (
        <EmptyState title="No saved pins yet">
          Save the active pins of a report above, or paste a pin string with “New pin”.
        </EmptyState>
      )}
      {pins.length > 0 && visiblePins.length === 0 && (
        <EmptyState title="No matching pins">Try another search term or tag.</EmptyState>
      )}
      <ul className="list">
        {visiblePins.map((pin) =>
          isEditing(pinEditor.editor, pin.id) ? (
            <li key={pin.id} className="list-item list-item--editing">
              <PinForm
                title={`Edit “${pin.name}”`}
                initialValues={pinFormValuesFromPin(pin)}
                canEditPinString
                submitLabel="Save changes"
                onSubmit={pinEditor.saveEdit(pin.id)}
                onCancel={pinEditor.closeEditor}
              />
            </li>
          ) : (
            <PinListItem key={pin.id} pin={pin} onEdit={() => pinEditor.startEditing(pin.id)} />
          ),
        )}
      </ul>
    </section>
  );
}
