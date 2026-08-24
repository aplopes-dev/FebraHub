'use client';

import { motion, useReducedMotion } from 'motion/react';
import { Logo } from '@citybox/ui/molecules';
import { cn } from '@/lib/cn';

type StoreLoadingShellProps = {
  /** Mensagem principal — ex.: "Carregando Varejo…". */
  message: string;
  /** Linha auxiliar opcional abaixo da mensagem. */
  description?: string;
  className?: string;
};

/**
 * Tela de carregamento padrão exibida ao abrir ou trocar de loja/vertical.
 * Cobre toda a viewport enquanto sessão, permissões, manifesto da vertical e
 * dados da loja são resolvidos. Visual neutro — não usa cores de marca/tema.
 */
export function StoreLoadingShell({ message, description, className }: StoreLoadingShellProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message}
      className={cn(
        'fixed inset-0 z-40 flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background px-6',
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklch,var(--foreground)_4%,transparent)_0%,transparent_70%)]"
      />

      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="relative flex size-28 items-center justify-center">
          {!reduceMotion ? (
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-full border-2 border-muted-foreground/15 border-t-muted-foreground/60"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
            />
          ) : (
            <span aria-hidden className="absolute inset-0 rounded-full border-2 border-muted-foreground/20" />
          )}

          <motion.div
            animate={reduceMotion ? undefined : { scale: [1, 1.06, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Logo variant="symbol" className="h-12 w-12 text-foreground" />
          </motion.div>
        </div>

        <div className="flex max-w-xs flex-col items-center gap-1.5 text-center">
          <p className="text-sm font-medium text-foreground">{message}</p>
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
      </div>
    </div>
  );
}
