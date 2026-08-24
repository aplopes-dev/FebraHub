'use client';

import type { ReactNode } from 'react';
import { Logo } from '@citybox/ui/molecules';
import { cn } from '@/lib/cn';
import { AuthStatusPanel } from './auth-status-panel';

const DEFAULT_FOOTER = 'Acesso restrito · Somente membros autorizados';

type AuthPageShellProps = {
  title?: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  /** Glow sutil com tokens warm no fundo */
  ambient?: boolean;
  /** Largura do card — padrão 400px; seleção de loja pode usar mais */
  cardClassName?: string;
  className?: string;
};

export function AuthPageShell({
  title,
  description,
  children,
  footer = DEFAULT_FOOTER,
  ambient = true,
  cardClassName,
  className,
}: AuthPageShellProps) {
  return (
    <main className={cn('relative flex min-h-svh flex-col items-center justify-center p-6', className)}>
      {ambient ? <div className="erp-auth-ambient" aria-hidden="true" /> : null}

      <div className={cn('relative z-10 w-full max-w-[400px]', cardClassName)}>
        <div className="rounded-2xl border bg-card px-8 py-10 shadow-sm">
          <Logo variant="full" className="mb-8 h-8" brandGradient="primary" />

          {title || description ? (
            <div className="mb-7">
              {title ? (
                <h1 className="font-display text-xl font-semibold tracking-tight">{title}</h1>
              ) : null}
              {description ? (
                <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
          ) : null}

          {children}
        </div>

        {footer ? (
          <p className="mt-5 text-center text-xs text-muted-foreground">{footer}</p>
        ) : null}
      </div>
    </main>
  );
}

type AuthLoadingShellProps = {
  message: string;
  title?: string;
  description?: string;
  footer?: ReactNode;
};

/** Estado de carregamento — telas transitórias (home, callback, entrada, sso). */
export function AuthLoadingShell({
  message,
  title = 'Acesso ao backoffice',
  description,
  footer,
}: AuthLoadingShellProps) {
  return (
    <AuthPageShell title={title} description={description} footer={footer}>
      <AuthStatusPanel variant="loading" message={message} />
    </AuthPageShell>
  );
}
