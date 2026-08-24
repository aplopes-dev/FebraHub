'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthPageShell } from '@/components/auth/auth-page-shell';
import { AuthLoginPrompt } from '@/components/auth/auth-login-prompt';

function readLoginQuery(params: URLSearchParams) {
  return {
    forceLogin: params.get('reauth') === '1',
    fromInvite: params.get('from') === 'invite',
    loggedOut: params.get('loggedOut') === '1',
    exchangeFailed: params.get('error') === 'exchange_failed',
  };
}

function LoginInner() {
  const params = useSearchParams();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (readLoginQuery(params).fromInvite) {
      window.location.replace('/auth/sso');
    }
  }, [ready, params]);

  if (!ready) {
    return <AuthPageShell title="Acesso ao backoffice" />;
  }

  const query = readLoginQuery(params);

  return (
    <AuthLoginPrompt
      forceLogin={query.forceLogin}
      loggedOut={query.loggedOut}
      exchangeFailed={query.exchangeFailed}
    />
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthPageShell title="Acesso ao backoffice" />}>
      <LoginInner />
    </Suspense>
  );
}
