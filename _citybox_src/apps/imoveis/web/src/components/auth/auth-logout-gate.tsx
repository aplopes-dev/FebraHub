'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthLoadingShell } from '@/components/auth/auth-page-shell';
import { useAuthSession } from '@/lib/session-context';

export function useRequireAuth(loginPath = '/login') {
  const { status, loggingOut } = useAuthSession();
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

export function AuthLogoutGate({ children }: AuthLogoutGateProps) {
  const { loggingOut, status } = useAuthSession();

  if (loggingOut) {
    return <AuthLoadingShell message="Saindo da conta…" />;
  }

  if (status === 'anonymous') {
    return null;
  }

  return children;
}
