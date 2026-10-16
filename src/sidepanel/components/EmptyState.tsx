import type { ReactNode } from 'react';

type EmptyStateProps = {
  readonly title: string;
  readonly children: ReactNode;
};

export function EmptyState({ title, children }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <p className="empty-state-title">{title}</p>
      <p className="empty-state-text">{children}</p>
    </div>
  );
}
