import { useState } from 'react';
import type { EntryDraft } from '../../library/libraryOperations';
import type { PinString } from '../../wcl/pinString';
import { useStatus } from '../status/StatusContext';
import { useLibraryActions } from './useLibrary';

export interface ActivePinSaving {
  readonly pinBeingSaved: PinString | null;
  readonly isSavingAll: boolean;
  startSavingPin(pin: PinString): void;
  cancelSavingPin(): void;
  savePin(draft: EntryDraft): Promise<void>;
  startSavingAll(): void;
  cancelSavingAll(): void;
  saveAll(draft: EntryDraft): Promise<void>;
}

export function useActivePinSaving(): ActivePinSaving {
  const { saveEntry } = useLibraryActions();
  const { trackTask } = useStatus();
  const [pinBeingSaved, setPinBeingSaved] = useState<PinString | null>(null);
  const [isSavingAll, setIsSavingAll] = useState(false);

  const save = (draft: EntryDraft): Promise<boolean> =>
    trackTask(() => saveEntry(draft), () => `Saved "${draft.name}".`);

  return {
    pinBeingSaved,
    isSavingAll,
    startSavingPin: setPinBeingSaved,
    cancelSavingPin: () => setPinBeingSaved(null),
    savePin: async (draft) => {
      if (await save(draft)) {
        setPinBeingSaved(null);
      }
    },
    startSavingAll: () => setIsSavingAll(true),
    cancelSavingAll: () => setIsSavingAll(false),
    saveAll: async (draft) => {
      if (await save(draft)) {
        setIsSavingAll(false);
      }
    },
  };
}
