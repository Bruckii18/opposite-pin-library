export type WaitUntil = (condition: () => boolean) => Promise<boolean>;

export interface ConditionWaiterOptions {
  readonly timeoutMs: number;
  readonly intervalMs: number;
}

export function createConditionWaiter({ timeoutMs, intervalMs }: ConditionWaiterOptions): WaitUntil {
  return async (condition) => {
    const deadline = Date.now() + timeoutMs;
    while (!condition()) {
      if (Date.now() >= deadline) {
        return false;
      }
      await delay(intervalMs);
    }
    return true;
  };
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
