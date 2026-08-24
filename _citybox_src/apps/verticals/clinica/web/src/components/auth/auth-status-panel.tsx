'use client';

import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export type AuthStatusVariant = 'loading' | 'success' | 'warning' | 'error';

type AuthStatusPanelProps = {
  variant: AuthStatusVariant;
  message: string;
  className?: string;
};

const variantStyles: Record<AuthStatusVariant, string> = {
  loading: 'bg-muted/60 text-muted-foreground',
  success: 'bg-green-50 text-green-800',
  warning: 'bg-amber-50 text-amber-800',
  error: 'bg-destructive/10 text-destructive',
};

function StatusIcon({ variant }: { variant: AuthStatusVariant }) {
  if (variant === 'loading') {
    return <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />;
  }
  if (variant === 'success') {
    return <CheckCircle className="size-4 shrink-0" aria-hidden />;
  }
  return <AlertCircle className={cn('size-4 shrink-0', variant === 'error' && 'mt-0.5')} aria-hidden />;
}

export function AuthStatusPanel({ variant, message, className }: AuthStatusPanelProps) {
  return (
    <div
      role={variant === 'error' || variant === 'warning' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-3 rounded-lg px-4 py-3 text-sm',
        variantStyles[variant],
        variant === 'loading' && 'items-center',
        className,
      )}
    >
      <StatusIcon variant={variant} />
      <span>{message}</span>
    </div>
  );
}
