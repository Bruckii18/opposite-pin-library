import { createContext, useContext } from 'react';

export const StatusTone = {
  Success: 'success',
  Error: 'error',
} as const;
export type StatusTone = (typeof StatusTone)[keyof typeof StatusTone];

export interface StatusMessage {
  readonly id: number;
  readonly tone: StatusTone;
  readonly text: string;
}

export interface StatusApi {
  readonly currentStatus: StatusMessage | null;
  dismissStatus(): void;
  trackTask<Value>(task: () => Promise<Value>, describeSuccess?: (value: Value) => string): Promise<boolean>;
}

export const StatusContext = createContext<StatusApi | null>(null);

export function useStatus(): StatusApi {
  const status = useContext(StatusContext);
  if (status === null) {
    throw new Error('useStatus must be used inside StatusProvider.');
  }
  return status;
}
