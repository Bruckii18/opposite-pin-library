import { StatusTone, useStatus } from '../status/StatusContext';

export function StatusBar() {
  const { currentStatus, dismissStatus } = useStatus();
  if (currentStatus === null) {
    return null;
  }
  const isError = currentStatus.tone === StatusTone.Error;
  return (
    <div
      key={currentStatus.id}
      className={`status-bar status-bar--${currentStatus.tone}`}
      role={isError ? 'alert' : 'status'}
    >
      <p className="status-bar-text">{currentStatus.text}</p>
      <button
        type="button"
        className="icon-button icon-button--small"
        aria-label="Dismiss message"
        onClick={dismissStatus}
      >
        ×
      </button>
    </div>
  );
}
