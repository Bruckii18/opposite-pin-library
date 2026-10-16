import { tagKey } from '../../library/tags';
import { toggleFilterTag, type LibraryFilter } from '../../library/librarySearch';

type LibraryFilterBarProps = {
  readonly filter: LibraryFilter;
  readonly availableTags: readonly string[];
  readonly searchLabel: string;
  readonly createLabel: string;
  readonly onFilterChange: (filter: LibraryFilter) => void;
  readonly onCreate: () => void;
};

export function LibraryFilterBar({
  filter,
  availableTags,
  searchLabel,
  createLabel,
  onFilterChange,
  onCreate,
}: LibraryFilterBarProps) {
  const selectedTagKeys = new Set(filter.tags.map(tagKey));
  return (
    <div className="filter-bar">
      <div className="filter-bar-row">
        <input
          className="input"
          type="search"
          placeholder={searchLabel}
          aria-label={searchLabel}
          value={filter.text}
          onChange={(event) => onFilterChange({ ...filter, text: event.target.value })}
        />
        <button type="button" className="button button--primary" onClick={onCreate}>
          + {createLabel}
        </button>
      </div>
      {availableTags.length > 0 && (
        <div className="tag-filter" role="group" aria-label="Filter by tag">
          {availableTags.map((tag) => (
            <button
              key={tagKey(tag)}
              type="button"
              className="tag tag--toggle"
              aria-pressed={selectedTagKeys.has(tagKey(tag))}
              onClick={() => onFilterChange(toggleFilterTag(filter, tag))}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
