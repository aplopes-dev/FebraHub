'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from '@/lib/session-context';

/**
 * Guarda de runtime das telas privadas.
 *
 * O `proxy.ts` já barra quem chega sem cookie; este gate cobre o que ele não
 * vê: sessão que **expira com a aba aberta** ou cookie revogado no servidor.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status, loggingOut } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status !== 'anonymous' || loggingOut) return;
    const from = pathname && pathname !== '/' ? `&from=${encodeURIComponent(pathname)}` : '';
    router.replace(`/login?reauth=1${from}`);
  }, [loggingOut, pathname, router, status]);

  if (status === 'loading') {
    return <AuthSplash label="Carregando sua sessão…" />;
  }
  if (status === 'anonymous' || loggingOut) {
    return <AuthSplash label={loggingOut ? 'Saindo…' : 'Redirecionando…'} />;
  }

  return <>{children}</>;
}

function AuthSplash({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen items-center justify-center bg-background"
    >
      <div className="flex flex-col items-center gap-3">
        <div
          aria-hidden
          className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary"
        />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
