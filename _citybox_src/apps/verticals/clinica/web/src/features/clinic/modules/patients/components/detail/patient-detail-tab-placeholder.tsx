'use client';

import { EmptyState } from '@citybox/ui/organisms';

type PatientDetailTabPlaceholderProps = {
  title: string;
  description: string;
};

export function PatientDetailTabPlaceholder({
  title,
  description,
}: PatientDetailTabPlaceholderProps) {
  return (
    <EmptyState
      title={title}
      description={description}
      className="rounded-2xl border border-border/60 bg-card/40"
    />
  );
}
