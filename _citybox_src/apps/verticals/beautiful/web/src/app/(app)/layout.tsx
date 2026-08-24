'use client';

import type { ReactNode } from 'react';
import {
  AuthLogoutGate,
  useRequireAuth,
} from '@/components/auth/auth-logout-gate';
import { ActiveStoreSync } from '@/components/auth/active-store-sync';
import { BeautifulErpLayout } from '@/shell/beautiful-erp-layout';

function AuthenticatedApp({ children }: { children: ReactNode }) {
  useRequireAuth();
  return (
    <AuthLogoutGate>
      <ActiveStoreSync>
        <BeautifulErpLayout>{children}</BeautifulErpLayout>
      </ActiveStoreSync>
    </AuthLogoutGate>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AuthenticatedApp>{children}</AuthenticatedApp>;
}
