import type { ReactNode } from 'react';
import { cn } from '@citybox/ui';
import { DashboardRouteNav } from './dashboard-route-nav';

type DashboardPageFrameProps = {
  children: ReactNode;
  /** Espaço entre as abas e o conteúdo. Default: `pt-6`. */
  contentClassName?: string;
};

export function DashboardPageFrame({
  children,
  contentClassName,
}: DashboardPageFrameProps) {
  return (
    <div className="-m-4 min-h-[calc(100%+2rem)] shrink-0 bg-[color-mix(in_oklch,var(--foreground)_6%,var(--background))] p-4">
      <DashboardRouteNav />
      <div className={cn(contentClassName ?? 'pt-6')}>{children}</div>
    </div>
  );
}
