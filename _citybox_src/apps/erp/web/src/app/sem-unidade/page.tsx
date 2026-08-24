"use client";

import { MapPin, RefreshCw } from "lucide-react";
import { Button } from "@citybox/ui/atoms";
import { Logo } from "@citybox/ui/molecules";
import { RequireAuth } from "@/components/auth/require-auth";
import { useOrganization } from "@/lib/organization-context";
import { useSession } from "@/lib/session-context";

const ORGANIZATION_KEY = "citybox-comercio-active-org";
const BRANCH_KEY = "citybox-comercio-active-branch";

/**
 * Estado vazio: empresa ativa sem nenhuma unidade acessível.
 *
 * Sem unidade não dá para operar o ERP (estoque, PDV, etc.).
 */
function NoBranch() {
  const { logout } = useSession();
  const { organization, reload, loading } = useOrganization();

  const chooseAnotherOrganization = () => {
    try {
      localStorage.removeItem(ORGANIZATION_KEY);
      localStorage.removeItem(BRANCH_KEY);
    } catch {
      // storage indisponível
    }
    window.location.assign("/selecionar-organizacao");
  };

  return (
    <main className="flex min-h-svh flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border bg-card px-8 py-10 text-center shadow-sm">
          <Logo
            variant="full"
            className="mx-auto mb-8 h-8"
            brandGradient="primary"
          />

          <span className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full bg-muted">
            <MapPin className="size-5 text-muted-foreground" aria-hidden />
          </span>

          <h1 className="text-xl font-semibold tracking-tight">
            Nenhuma unidade disponível
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {organization ? (
              <>
                A empresa{" "}
                <span className="font-medium">{organization.displayName}</span>{" "}
                não tem unidades ativas para o seu acesso.
              </>
            ) : (
              <>Não há unidades ativas para o seu acesso nesta empresa.</>
            )}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Peça ao responsável pela empresa para liberar uma unidade ou criar
            a matriz. Assim que isso for feito, atualize esta página.
          </p>

          <div className="mt-8 flex flex-col gap-2">
            <Button type="button" onClick={reload} disabled={loading}>
              <RefreshCw className="size-4" />
              Verificar novamente
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={chooseAnotherOrganization}
            >
              Escolher outra empresa
            </Button>
            <Button type="button" variant="ghost" onClick={() => void logout()}>
              Sair da conta
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SemUnidadePage() {
  return (
    <RequireAuth>
      <NoBranch />
    </RequireAuth>
  );
}
