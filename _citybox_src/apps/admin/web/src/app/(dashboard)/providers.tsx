"use client";

import { SessionProvider } from "@/lib/session-context";
import { QueryProvider } from "@/lib/query-provider";
import { PlatformAdminLayout } from "@/components/platform-admin-layout";
import NextTopLoader from "nextjs-toploader";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>
        <NextTopLoader color="#000" height={3} showSpinner={false} />

        <PlatformAdminLayout>{children}</PlatformAdminLayout>
      </QueryProvider>
    </SessionProvider>
  );
}
