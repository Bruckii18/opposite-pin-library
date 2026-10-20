import { describePin, PinKind, type PinString } from '../../wcl/pinString';
import type { ViewParams } from '../../wcl/viewParams';
import { ViewLabel } from './ViewLabel';

type PinSummaryProps = {
  readonly pinString: PinString;
  readonly viewParams?: ViewParams | undefined;
};

const KIND_CLASS_NAMES: Record<PinKind, string> = {
  [PinKind.Decorator]: 'kind-badge--decorator',
  [PinKind.Badge]: 'kind-badge--badge',
  [PinKind.Filter]: 'kind-badge--filter',
  [PinKind.Summary]: 'kind-badge--summary',
  [PinKind.DpsWeight]: 'kind-badge--weight',
  [PinKind.Unknown]: 'kind-badge--unknown',
};

export function PinSummary({ pinString, viewParams }: PinSummaryProps) {
  const { kind, color, summary } = describePin(pinString);
  return (
    <div className="pin-summary">
      <span className={`kind-badge ${KIND_CLASS_NAMES[kind]}`}>{kind}</span>
      {color !== null && (
        <span className="color-swatch" style={{ backgroundColor: color }} aria-hidden="true" />
      )}
      <code className="pin-summary-text" title={pinString}>
        {summary}
      </code>
      {viewParams !== undefined && <ViewLabel viewParams={viewParams} />}
    </div>
  );
}
