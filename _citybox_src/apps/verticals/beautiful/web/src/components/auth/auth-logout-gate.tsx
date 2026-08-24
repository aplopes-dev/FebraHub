'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthLoadingShell } from '@/components/auth/auth-page-shell';
import { useSession } from '@/lib/session-context';

/** Redireciona para /login quando anônimo — exceto durante logout em andamento. */
export function useRequireAuth(loginPath = '/login') {
  const { status, loggingOut } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'anonymous' && !loggingOut) {
      router.replace(loginPath);
    }
  }, [loginPath, loggingOut, router, status]);
}

type AuthLogoutGateProps = {
  children: ReactNode;
};

/** Bloqueia a UI e evita redirects paralelos enquanto o logout SSO completa. */
export function AuthLogoutGate({ children }: AuthLogoutGateProps) {
  const { loggingOut, status } = useSession();

  if (loggingOut) {
    return <AuthLoadingShell message="Saindo da conta…" />;
  }

  if (status === 'anonymous' || status === 'loading') {
    return status === 'loading' ? (
      <AuthLoadingShell message="Carregando sessão…" />
    ) : null;
  }

  return children;
}
