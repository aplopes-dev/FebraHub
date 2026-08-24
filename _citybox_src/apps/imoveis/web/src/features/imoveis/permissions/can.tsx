'use client';

import type { ReactNode } from 'react';
import type { Actions, Subjects } from '@citybox/imoveis-permissions';
import { useCan } from './use-can';

type CanProps = {
  action: Actions;
  subject: Subjects;
  children: ReactNode;
  fallback?: ReactNode;
};

export function Can({
  action,
  subject,
  children,
  fallback = null,
}: CanProps) {
  const allowed = useCan(action, subject);
  return allowed ? <>{children}</> : <>{fallback}</>;
}
