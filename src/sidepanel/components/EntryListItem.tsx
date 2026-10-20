import { useMemo } from 'react';
import { entryApplyTarget } from '../../library/applyTargets';
import { isSinglePinEntry } from '../../library/libraryOperations';
import type { LibraryEntry } from '../../library/librarySchema';
import type { PinString } from '../../wcl/pinString';
import { useEntryItemActions } from '../hooks/useEntryItemActions';
import { ApplyButtons } from './ApplyButtons';
import { ConfirmMenuItem } from './ConfirmMenuItem';
import { EntryPinList } from './EntryPinList';
import { ListItemMeta } from './ListItemMeta';
import { MenuItem } from './MenuItem';
import { MoreActionsMenu } from './MoreActionsMenu';

const MAX_VISIBLE_PINS = 4;

type EntryListItemProps = {
  readonly entry: LibraryEntry;
  readonly namesByPin: ReadonlyMap<PinString, string>;
  readonly onEdit: () => void;
};

export function EntryListItem({ entry, namesByPin, onEdit }: EntryListItemProps) {
  const { copyPins, exportEntry, duplicate, remove } = useEntryItemActions(entry);
  const applyTarget = useMemo(() => entryApplyTarget(entry), [entry]);
  const isSinglePin = isSinglePinEntry(entry);

  return (
    <li className="list-item">
      <div className="list-item-header">
        <p className="list-item-name">
          <span className="list-item-title" title={entry.name}>
            {entry.name}
          </span>
        </p>
        <div className="list-item-actions">
          <ApplyButtons target={applyTarget} />
          <MoreActionsMenu label={`More actions for ${entry.name}`}>
            <MenuItem label="Edit" onSelect={onEdit} />
            <MenuItem label={isSinglePin ? 'Copy pin string' : 'Copy pin strings'} onSelect={copyPins} />
            <MenuItem label="Export as JSON" onSelect={exportEntry} />
            <MenuItem label="Duplicate" onSelect={duplicate} />
            <ConfirmMenuItem label="Delete" confirmLabel="Click again to delete" onConfirm={remove} />
          </MoreActionsMenu>
        </div>
      </div>
      <EntryPinList
        pins={entry.pins}
        namesByPin={isSinglePin ? undefined : namesByPin}
        maxVisible={MAX_VISIBLE_PINS}
      />
      {entry.description !== '' && <p className="list-item-description">{entry.description}</p>}
      <ListItemMeta viewParams={entry.viewParams} tags={entry.tags} />
    </li>
  );
}
