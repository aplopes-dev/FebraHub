'use client';

import { useEffect, useRef } from 'react';
import { AuthLoadingShell } from '@/components/auth/auth-page-shell';
import { getLoginUrl } from '@/lib/auth';

export default function AuthSsoPage() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const redirectUri = `${window.location.origin}/auth/callback`;
    void getLoginUrl(redirectUri).then((url) => {
      window.location.replace(url);
    });
  }, []);

  return <AuthLoadingShell message="Conectando ao backoffice…" />;
}
