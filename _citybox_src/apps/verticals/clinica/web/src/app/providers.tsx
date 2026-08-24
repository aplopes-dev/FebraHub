'use client';

import NextTopLoader from 'nextjs-toploader';
import { PermissionsProvider } from '@/lib/permissions-context';
import { QueryProvider } from '@/lib/query-provider';
import { SessionProvider } from '@/lib/session-context';
import { StoreProvider } from '@/lib/store-context';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PermissionsProvider>
        <StoreProvider>
          <QueryProvider>
            <NextTopLoader color="var(--primary)" height={3} showSpinner={false} />
            {children}
          </QueryProvider>
        </StoreProvider>
      </PermissionsProvider>
    </SessionProvider>
  );
}
