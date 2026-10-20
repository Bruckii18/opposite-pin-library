import { describePin, PinKind, type PinString } from '../../wcl/pinString';

type PinSummaryProps = {
  readonly pinString: PinString;
  readonly label?: string | undefined;
};

const KIND_CLASS_NAMES: Record<PinKind, string> = {
  [PinKind.Decorator]: 'kind-badge--decorator',
  [PinKind.Badge]: 'kind-badge--badge',
  [PinKind.Filter]: 'kind-badge--filter',
  [PinKind.Summary]: 'kind-badge--summary',
  [PinKind.DpsWeight]: 'kind-badge--weight',
  [PinKind.Unknown]: 'kind-badge--unknown',
};

export function PinSummary({ pinString, label }: PinSummaryProps) {
  const { kind, color, summary } = describePin(pinString);
  return (
    <div className="pin-summary">
      <span className={`kind-badge ${KIND_CLASS_NAMES[kind]}`}>{kind}</span>
      {color !== null && (
        <span className="color-swatch" style={{ backgroundColor: color }} aria-hidden="true" />
      )}
      {label === undefined ? (
        <code className="pin-summary-text" title={pinString}>
          {summary}
        </code>
      ) : (
        <span className="pin-summary-label" title={summary}>
          {label}
        </span>
      )}
    </div>
  );
}
