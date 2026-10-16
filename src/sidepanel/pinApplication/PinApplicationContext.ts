import { createContext, useContext } from 'react';
import type { ApplyMode } from '../../apply/applyPlan';
import type { PinString } from '../../wcl/pinString';

export interface PinApplication {
  readonly canApply: boolean;
  readonly isApplying: boolean;
  applyPins(pins: readonly PinString[], mode: ApplyMode): Promise<void>;
}

export const PinApplicationContext = createContext<PinApplication | null>(null);

export function usePinApplication(): PinApplication {
  const pinApplication = useContext(PinApplicationContext);
  if (pinApplication === null) {
    throw new Error('usePinApplication must be used inside PinApplicationProvider.');
  }
  return pinApplication;
}
