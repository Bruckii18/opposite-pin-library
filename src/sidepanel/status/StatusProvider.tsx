import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { describeError, logError } from '../../shared/errors';
import { StatusContext, StatusTone, type StatusApi, type StatusMessage } from './StatusContext';

type StatusProviderProps = {
  readonly children: ReactNode;
};

const SUCCESS_DISPLAY_MS = 4_000;

export function StatusProvider({ children }: StatusProviderProps) {
  const [currentStatus, setCurrentStatus] = useState<StatusMessage | null>(null);
  const nextStatusId = useRef(0);

  const showStatus = useCallback((tone: StatusTone, text: string) => {
    nextStatusId.current += 1;
    setCurrentStatus({ id: nextStatusId.current, tone, text });
  }, []);

  const dismissStatus = useCallback(() => setCurrentStatus(null), []);

  const trackTask = useCallback<StatusApi['trackTask']>(
    async (task, describeSuccess) => {
      try {
        const value = await task();
        if (describeSuccess !== undefined) {
          showStatus(StatusTone.Success, describeSuccess(value));
        }
        return true;
      } catch (error) {
        logError('A panel action failed.', error);
        showStatus(StatusTone.Error, describeError(error));
        return false;
      }
    },
    [showStatus],
  );

  useEffect(() => {
    if (currentStatus?.tone !== StatusTone.Success) {
      return;
    }
    const timeoutId = setTimeout(dismissStatus, SUCCESS_DISPLAY_MS);
    return () => clearTimeout(timeoutId);
  }, [currentStatus, dismissStatus]);

  const statusApi = useMemo<StatusApi>(
    () => ({ currentStatus, dismissStatus, trackTask }),
    [currentStatus, dismissStatus, trackTask],
  );

  return <StatusContext.Provider value={statusApi}>{children}</StatusContext.Provider>;
}
