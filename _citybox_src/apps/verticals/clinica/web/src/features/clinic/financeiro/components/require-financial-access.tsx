"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useFinancialPermissions } from "../hooks/use-financial-permissions";

type AccessKey =
  | "canAccessCashFlow"
  | "canAccessTransactions"
  | "canAccessCommissions"
  | "canAccessSettings";

/**
 * Redireciona para o fluxo de caixa (ou `/`) se o usuário não tiver a aba.
 */
export function RequireFinancialAccess({
  access,
  children,
}: {
  access: AccessKey;
  children: React.ReactNode;
}) {
  const perms = useFinancialPermissions();
  const router = useRouter();
  const allowed = perms[access];
  const fallback = perms.canAccessCashFlow
    ? "/financeiro/fluxo-de-caixa"
    : perms.canAccessSettings
      ? "/financeiro/configuracoes"
      : perms.canAccessCommissions
        ? "/financeiro/comissoes"
        : "/";

  useEffect(() => {
    if (!allowed) {
      router.replace(fallback);
    }
  }, [allowed, fallback, router]);

  if (!allowed) return null;
  return <>{children}</>;
}
