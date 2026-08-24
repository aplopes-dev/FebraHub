"use client";

import type { ReactNode } from "react";
import { RequireAuth } from "@/components/auth/require-auth";
import { ComercioErpLayout } from "@/shell/comercio-erp-layout";

export default function AppShellLayout({ children }: { children: ReactNode }) {
  // RequireAuth por fora do shell: sem sessão, nem o menu chega a renderizar.
  return (
    <RequireAuth>
      <ComercioErpLayout>{children}</ComercioErpLayout>
    </RequireAuth>
  );
}
