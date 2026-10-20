import { useMemo } from 'react';
import { pinApplyTarget } from '../../library/applyTargets';
import type { SavedPin } from '../../library/librarySchema';
import { usePinItemActions } from '../hooks/usePinItemActions';
import { ApplyButtons } from './ApplyButtons';
import { ConfirmMenuItem } from './ConfirmMenuItem';
import { MenuItem } from './MenuItem';
import { MoreActionsMenu } from './MoreActionsMenu';
import { PinSummary } from './PinSummary';
import { TagList } from './TagList';

type PinListItemProps = {
  readonly pin: SavedPin;
  readonly onEdit: () => void;
};

export function PinListItem({ pin, onEdit }: PinListItemProps) {
  const { copyPinString, duplicate, remove } = usePinItemActions(pin);
  const applyTarget = useMemo(() => pinApplyTarget(pin), [pin]);
  return (
    <li className="list-item">
      <p className="list-item-name">{pin.name}</p>
      <PinSummary pinString={pin.pinString} viewParams={pin.viewParams} />
      {pin.description !== '' && <p className="list-item-description">{pin.description}</p>}
      <TagList tags={pin.tags} />
      <div className="list-item-actions">
        <ApplyButtons target={applyTarget} />
        <div className="list-item-actions-end">
          <button type="button" className="button button--ghost button--small" onClick={onEdit}>
            Edit
          </button>
          <MoreActionsMenu label={`More actions for ${pin.name}`}>
            <MenuItem label="Copy pin string" onSelect={copyPinString} />
            <MenuItem label="Duplicate" onSelect={duplicate} />
            <ConfirmMenuItem label="Delete" confirmLabel="Click again to delete" onConfirm={remove} />
          </MoreActionsMenu>
        </div>
      </div>
    </li>
  );
}
