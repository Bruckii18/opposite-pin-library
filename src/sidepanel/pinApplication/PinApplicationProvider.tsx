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
  const hasActivePins =
    activeTab.status === ActiveTabStatus.Report && activeTab.report.activePins.length > 0;

  const applyTarget = useCallback<PinApplication['applyTarget']>(
    async (target, mode) => {
      setIsApplying(true);
      await trackTask(
        () => pinApplier.applyPins(target.pins, mode, target.viewParams),
        (result) => describeApplyResult(result, mode),
      );
      setIsApplying(false);
    },
    [pinApplier, trackTask],
  );

  const pinApplication = useMemo<PinApplication>(
    () => ({
      canApply: activeTab.status === ActiveTabStatus.Report && !isApplying,
      hasActivePins,
      isApplying,
      applyTarget,
    }),
    [activeTab.status, hasActivePins, isApplying, applyTarget],
  );

  return (
    <PinApplicationContext.Provider value={pinApplication}>{children}</PinApplicationContext.Provider>
  );
}
