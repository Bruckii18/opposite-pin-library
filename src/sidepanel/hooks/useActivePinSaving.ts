import { useState } from 'react';
import type { PinDraft, PinSetDetails } from '../../library/libraryOperations';
import type { PinString } from '../../wcl/pinString';
import { useStatus } from '../status/StatusContext';
import { useLibraryActions } from './useLibrary';

export interface ActivePinSaving {
  readonly pinBeingSaved: PinString | null;
  readonly isSavingAsSet: boolean;
  startSavingPin(pin: PinString): void;
  cancelSavingPin(): void;
  savePin(draft: PinDraft): Promise<void>;
  startSavingAsSet(): void;
  cancelSavingAsSet(): void;
  saveAsSet(details: PinSetDetails): Promise<void>;
}

export function useActivePinSaving(activePins: readonly PinString[]): ActivePinSaving {
  const { savePin, savePinsAsSet } = useLibraryActions();
  const { trackTask } = useStatus();
  const [pinBeingSaved, setPinBeingSaved] = useState<PinString | null>(null);
  const [isSavingAsSet, setIsSavingAsSet] = useState(false);

  return {
    pinBeingSaved,
    isSavingAsSet,
    startSavingPin: setPinBeingSaved,
    cancelSavingPin: () => setPinBeingSaved(null),
    savePin: async (draft) => {
      if (await trackTask(() => savePin(draft), () => `Saved "${draft.name}".`)) {
        setPinBeingSaved(null);
      }
    },
    startSavingAsSet: () => setIsSavingAsSet(true),
    cancelSavingAsSet: () => setIsSavingAsSet(false),
    saveAsSet: async (details) => {
      const isSaved = await trackTask(
        () => savePinsAsSet(activePins, details),
        () => `Saved the set "${details.name}".`,
      );
      if (isSaved) {
        setIsSavingAsSet(false);
      }
    },
  };
}
