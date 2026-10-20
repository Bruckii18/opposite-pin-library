import { createContext, useContext } from 'react';
import type { ApplyMode } from '../../apply/applyPlan';
import type { ApplyTarget } from '../../library/applyTargets';

export interface PinApplication {
  readonly canApply: boolean;
  readonly hasActivePins: boolean;
  readonly isApplying: boolean;
  applyTarget(target: ApplyTarget, mode: ApplyMode): Promise<void>;
}

export const PinApplicationContext = createContext<PinApplication | null>(null);

export function usePinApplication(): PinApplication {
  const pinApplication = useContext(PinApplicationContext);
  if (pinApplication === null) {
    throw new Error('usePinApplication must be used inside PinApplicationProvider.');
  }
  return pinApplication;
}
