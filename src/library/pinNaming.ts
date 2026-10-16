import { describePin, type PinString } from '../wcl/pinString';

const MAX_SUGGESTED_NAME_LENGTH = 60;
const ELLIPSIS = '…';
const COPY_SUFFIX = ' (copy)';

export function suggestPinName(pin: PinString): string {
  const { kind, summary } = describePin(pin);
  return truncate(summary === '' ? kind : `${kind}: ${summary}`, MAX_SUGGESTED_NAME_LENGTH);
}

export function nameForCopy(name: string): string {
  return `${name}${COPY_SUFFIX}`;
}

function truncate(text: string, maxLength: number): string {
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - ELLIPSIS.length)}${ELLIPSIS}`;
}
