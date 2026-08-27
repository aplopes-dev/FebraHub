import type { ReactNode } from "react";
import { AppShell } from "@/shell/app-shell";

/**
 * Nenhuma tela do backoffice pode ser HTML estático: todas dependem da empresa
 * e da unidade ativas, e várias leem a URL (`useSearchParams`) para aba, filtro
 * e paginação. Sem isto, o build tenta pré-renderizar e falha no bailout de CSR.
 */
export const dynamic = "force-dynamic";

export default function AppShellLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
