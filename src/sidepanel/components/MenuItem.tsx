type MenuItemProps = {
  readonly label: string;
  readonly onSelect: () => void;
};

export function MenuItem({ label, onSelect }: MenuItemProps) {
  return (
    <button type="button" className="menu-item" onClick={onSelect}>
      {label}
    </button>
  );
}
