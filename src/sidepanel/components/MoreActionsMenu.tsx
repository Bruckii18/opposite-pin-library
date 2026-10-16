import { useId, useRef, type MouseEvent, type ReactNode } from 'react';

type MoreActionsMenuProps = {
  readonly label: string;
  readonly children: ReactNode;
};

const NON_IDENT_CHARACTERS = /[^a-zA-Z0-9-]/g;

export function MoreActionsMenu({ label, children }: MoreActionsMenuProps) {
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const anchorName = `--menu-${menuId.replace(NON_IDENT_CHARACTERS, '')}`;

  const closeAfterAction = (event: MouseEvent<HTMLDivElement>): void => {
    if (event.target instanceof HTMLElement && event.target.dataset.keepMenuOpen === undefined) {
      menuRef.current?.hidePopover();
    }
  };

  return (
    <>
      <button
        type="button"
        className="button button--ghost button--small"
        popoverTarget={menuId}
        aria-label={label}
        title={label}
        style={{ anchorName }}
      >
        ⋯
      </button>
      <div
        ref={menuRef}
        id={menuId}
        popover="auto"
        className="menu"
        style={{ positionAnchor: anchorName }}
        onClick={closeAfterAction}
      >
        {children}
      </div>
    </>
  );
}
