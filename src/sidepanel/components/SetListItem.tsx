import { useMemo } from 'react';
import { resolveSetPins } from '../../library/libraryOperations';
import type { PinLibrary, PinSet } from '../../library/librarySchema';
import { useSetItemActions } from '../hooks/useSetItemActions';
import { ApplyButtons } from './ApplyButtons';
import { ConfirmMenuItem } from './ConfirmMenuItem';
import { MenuItem } from './MenuItem';
import { MoreActionsMenu } from './MoreActionsMenu';
import { TagList } from './TagList';

type SetListItemProps = {
  readonly library: PinLibrary;
  readonly set: PinSet;
  readonly onEdit: () => void;
};

export function SetListItem({ library, set, onEdit }: SetListItemProps) {
  const { exportSet, duplicate, remove } = useSetItemActions(library, set);
  const setPins = useMemo(() => resolveSetPins(library, set), [library, set]);
  const setPinStrings = useMemo(() => setPins.map((pin) => pin.pinString), [setPins]);

  return (
    <li className="list-item">
      <p className="list-item-name">
        {set.name}
        <span className="count">
          {setPins.length} {setPins.length === 1 ? 'pin' : 'pins'}
        </span>
      </p>
      {set.description !== '' && <p className="list-item-description">{set.description}</p>}
      <ul className="set-pin-names" aria-label={`Pins in ${set.name}`}>
        {setPins.map((pin) => (
          <li key={pin.id}>{pin.name}</li>
        ))}
      </ul>
      <TagList tags={set.tags} />
      <div className="list-item-actions">
        <ApplyButtons pins={setPinStrings} />
        <span className="list-item-actions-spacer" />
        <button type="button" className="button button--ghost button--small" onClick={onEdit}>
          Edit
        </button>
        <MoreActionsMenu label={`More actions for ${set.name}`}>
          <MenuItem label="Export as JSON" onSelect={exportSet} />
          <MenuItem label="Duplicate" onSelect={duplicate} />
          <ConfirmMenuItem label="Delete" confirmLabel="Click again to delete" onConfirm={remove} />
        </MoreActionsMenu>
      </div>
    </li>
  );
}
