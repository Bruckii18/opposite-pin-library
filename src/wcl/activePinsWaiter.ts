import { haveSamePins } from '../apply/applyPlan';
import type { WaitUntil } from '../shared/conditionWaiter';
import type { PinString } from './pinString';
import { readActivePins } from './reportUrl';

export type WaitForActivePins = (expectedPins: readonly PinString[]) => Promise<boolean>;

export interface ActivePinsWaiterDependencies {
  readonly readCurrentUrl: () => string;
  readonly waitUntil: WaitUntil;
}

export function createActivePinsWaiter({
  readCurrentUrl,
  waitUntil,
}: ActivePinsWaiterDependencies): WaitForActivePins {
  return (expectedPins) =>
    waitUntil(() => haveSamePins(readActivePins(new URL(readCurrentUrl())), expectedPins));
}
