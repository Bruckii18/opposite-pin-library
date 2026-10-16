import type { SavedPin } from '../../library/librarySchema';
import { copyToClipboard } from '../services/browserFiles';
import { useStatus } from '../status/StatusContext';
import { useLibraryActions } from './useLibrary';

export interface PinItemActions {
  copyPinString(): void;
  duplicate(): void;
  remove(): void;
}

export function usePinItemActions(pin: SavedPin): PinItemActions {
  const { duplicatePin, deletePin } = useLibraryActions();
  const { trackTask } = useStatus();
  return {
    copyPinString: () =>
      void trackTask(() => copyToClipboard(pin.pinString), () => 'Pin string copied to the clipboard.'),
    duplicate: () => void trackTask(() => duplicatePin(pin.id), () => `Duplicated "${pin.name}".`),
    remove: () => void trackTask(() => deletePin(pin.id), () => `Deleted "${pin.name}".`),
  };
}
