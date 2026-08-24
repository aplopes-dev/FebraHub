"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Logo } from "@citybox/ui/molecules";
import { useOrganization } from "@/lib/organization-context";
import { RequireAuth } from "@/components/auth/require-auth";

const HOME = "/visao-geral";

function safeInternalPath(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

/**
 * Bifurcação pós-login: decide para onde o usuário vai conforme os vínculos
 * que ele tem (empresas e unidades).
 *
 * Existe como página própria porque a resposta depende de dados da API, que só
 * chegam depois da sessão — o callback do OAuth não teria como decidir.
 */
function EntradaRouter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    organizations,
    organizationId,
    branches,
    needsBranchSelection,
    hydrated,
    loading,
    branchesLoading,
    error,
  } = useOrganization();

  useEffect(() => {
    if (!hydrated || loading) return;

    if (error) return;

    if (organizations.length === 0) {
      router.replace("/sem-organizacao");
      return;
    }

    if (!organizationId) {
      router.replace("/selecionar-organizacao");
      return;
    }

    // Unidades ainda carregando — espera antes de decidir.
    if (branchesLoading) return;

    if (branches.length === 0) {
      router.replace("/sem-unidade");
      return;
    }

    if (needsBranchSelection) {
      router.replace("/selecionar-unidade");
      return;
    }

    router.replace(safeInternalPath(searchParams.get("from")) ?? HOME);
  }, [
    branches.length,
    branchesLoading,
    error,
    hydrated,
    loading,
    needsBranchSelection,
    organizationId,
    organizations.length,
    router,
    searchParams,
  ]);

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-8">
      <Logo variant="symbol" className="h-12" brandGradient="primary" />
      {error ? (
        <div className="max-w-sm text-center">
          <p className="text-sm font-medium">
            Não foi possível carregar suas empresas.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {error === "unauthorized"
              ? "Sua sessão não tem acesso. Entre novamente."
              : "O serviço está indisponível no momento. Tente de novo em instantes."}
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span>Preparando seu acesso…</span>
        </div>
      )}
    </main>
  );
}

export function EntradaClient() {
  return (
    <RequireAuth>
      <EntradaRouter />
    </RequireAuth>
  );
}
