import type { ViewParams } from '../../wcl/viewParams';
import { describeViewParams, summarizeViewParams } from '../forms/viewFormModel';

type ViewLabelProps = {
  readonly viewParams: ViewParams;
};

export function ViewLabel({ viewParams }: ViewLabelProps) {
  return (
    <span
      className="view-badge"
      title={`Applying also switches the report to ${describeViewParams(viewParams)}.`}
    >
      View: {summarizeViewParams(viewParams)}
    </span>
  );
}
