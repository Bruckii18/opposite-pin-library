import type { ViewParams } from '../../wcl/viewParams';
import { TagList } from './TagList';
import { ViewLabel } from './ViewLabel';

type ListItemMetaProps = {
  readonly viewParams: ViewParams | undefined;
  readonly tags: readonly string[];
};

export function ListItemMeta({ viewParams, tags }: ListItemMetaProps) {
  if (viewParams === undefined && tags.length === 0) {
    return null;
  }
  return (
    <div className="list-item-meta">
      {viewParams !== undefined && <ViewLabel viewParams={viewParams} />}
      <TagList tags={tags} />
    </div>
  );
}
