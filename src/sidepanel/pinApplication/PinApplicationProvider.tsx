import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { useActiveTab } from '../hooks/useActiveTab';
import { usePanelServices } from '../PanelServicesContext';
import { ActiveTabStatus } from '../services/activeReportStore';
import { describeApplyResult } from '../services/statusMessages';
import { useStatus } from '../status/StatusContext';
import { PinApplicationContext, type PinApplication } from './PinApplicationContext';

type PinApplicationProviderProps = {
  readonly children: ReactNode;
};

export function PinApplicationProvider({ children }: PinApplicationProviderProps) {
  const { pinApplier } = usePanelServices();
  const { trackTask } = useStatus();
  const activeTab = useActiveTab();
  const [isApplying, setIsApplying] = useState(false);

  const applyPins = useCallback<PinApplication['applyPins']>(
    async (pins, mode) => {
      setIsApplying(true);
      await trackTask(
        () => pinApplier.applyPins(pins, mode),
        (result) => describeApplyResult(result, mode),
      );
      setIsApplying(false);
    },
    [pinApplier, trackTask],
  );

  const pinApplication = useMemo<PinApplication>(
    () => ({
      canApply: activeTab.status === ActiveTabStatus.Report && !isApplying,
      isApplying,
      applyPins,
    }),
    [activeTab.status, isApplying, applyPins],
  );

  return (
    <PinApplicationContext.Provider value={pinApplication}>{children}</PinApplicationContext.Provider>
  );
}
