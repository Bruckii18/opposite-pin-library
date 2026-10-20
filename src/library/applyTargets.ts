import type { PinString } from '../wcl/pinString';
import { haveSameViewParams, type ViewParams } from '../wcl/viewParams';
import type { PinSet, SavedPin } from './librarySchema';

export interface ViewSelection {
  readonly viewParams: ViewParams | null;
  readonly conflictWinnerName: string | null;
}

export interface ApplyTarget {
  readonly pins: readonly PinString[];
  readonly view: ViewSelection;
}

interface ViewSource {
  readonly name: string;
  readonly viewParams?: ViewParams | undefined;
}

interface SavedView {
  readonly name: string;
  readonly viewParams: ViewParams;
}

const KEEP_CURRENT_VIEW: ViewSelection = { viewParams: null, conflictWinnerName: null };

export function pinApplyTarget(pin: SavedPin): ApplyTarget {
  return { pins: [pin.pinString], view: selectView([pin]) };
}

export function setApplyTarget(set: PinSet, setPins: readonly SavedPin[]): ApplyTarget {
  return { pins: setPins.map((pin) => pin.pinString), view: selectView([...setPins, set]) };
}

function selectView(sources: readonly ViewSource[]): ViewSelection {
  const savedViews = sources.filter(hasSavedView);
  const lastSavedView = savedViews.at(-1);
  if (lastSavedView === undefined) {
    return KEEP_CURRENT_VIEW;
  }
  const hasConflict = savedViews.some(
    (savedView) => !haveSameViewParams(savedView.viewParams, lastSavedView.viewParams),
  );
  return {
    viewParams: lastSavedView.viewParams,
    conflictWinnerName: hasConflict ? lastSavedView.name : null,
  };
}

function hasSavedView(source: ViewSource): source is SavedView {
  return source.viewParams !== undefined;
}
