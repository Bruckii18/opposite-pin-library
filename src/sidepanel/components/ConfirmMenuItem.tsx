import { useState } from 'react';

type ConfirmMenuItemProps = {
  readonly label: string;
  readonly confirmLabel: string;
  readonly onConfirm: () => void;
};

export function ConfirmMenuItem({ label, confirmLabel, onConfirm }: ConfirmMenuItemProps) {
  const [isArmed, setIsArmed] = useState(false);
  return (
    <button
      type="button"
      className={isArmed ? 'menu-item menu-item--danger-armed' : 'menu-item menu-item--danger'}
      data-keep-menu-open={isArmed ? undefined : ''}
      onClick={isArmed ? onConfirm : () => setIsArmed(true)}
      onBlur={() => setIsArmed(false)}
    >
      {isArmed ? confirmLabel : label}
    </button>
  );
}
