import type { PinString } from '../wcl/pinString';
import type { ViewParams } from '../wcl/viewParams';
import type { LibraryEntry } from './librarySchema';

export interface ApplyTarget {
  readonly pins: readonly PinString[];
  readonly viewParams: ViewParams | null;
}

export function entryApplyTarget(entry: LibraryEntry): ApplyTarget {
  return { pins: entry.pins, viewParams: entry.viewParams ?? null };
}
