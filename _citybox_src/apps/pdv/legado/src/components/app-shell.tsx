import { cn } from '@citybox/ui';
import type { ReactNode } from 'react';

type AppShellProps = {
  children: ReactNode;
  className?: string;
  /** Se true, o conteúdo rola dentro do shell (padrão). Se false, o filho controla o overflow. */
  scrollable?: boolean;
};

/**
 * Shell estrutural do PDV em modo app (PWA standalone).
 * Aplica safe-area, trava overscroll no root e isola o scroll interno.
 */
export function AppShell({
  children,
  className,
  scrollable = true,
}: AppShellProps) {
  return (
    <div className={cn('pdv-app-root bg-background text-foreground', className)}>
      <div
        className={
          scrollable
            ? 'pdv-app-scroll'
            : 'flex min-h-0 flex-1 flex-col overflow-hidden'
        }
      >
        {children}
      </div>
    </div>
  );
}
