'use client';

import type { ReactNode } from 'react';
import { VerticalTopbar } from '@/shell/components/erp-topbar';

/**
 * Header do app. App dedicado à vertical Clínica — sempre a topbar padrão.
 * Assinatura mantida igual à do ERP para não divergir os componentes de layout.
 */
export function resolveVerticalHeader(verticalId: string): ReactNode {
  return <VerticalTopbar verticalId={verticalId} />;
}
