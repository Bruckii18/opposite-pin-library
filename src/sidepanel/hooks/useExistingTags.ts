import { useMemo } from 'react';
import { collectTagsByUsage } from '../../library/librarySearch';
import { LibraryStatus } from '../../library/libraryStore';
import { useLibraryState } from './useLibrary';

const NO_TAGS: readonly string[] = [];

export function useExistingTags(): readonly string[] {
  const libraryState = useLibraryState();
  return useMemo(
    () =>
      libraryState.status === LibraryStatus.Ready
        ? collectTagsByUsage(libraryState.library.entries)
        : NO_TAGS,
    [libraryState],
  );
}
