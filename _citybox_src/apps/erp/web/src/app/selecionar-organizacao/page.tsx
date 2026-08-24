"use client";

import { useRouter } from "next/navigation";
import { Building2, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@citybox/ui/atoms";
import { Logo } from "@citybox/ui/molecules";
import { RequireAuth } from "@/components/auth/require-auth";
import { useOrganization } from "@/lib/organization-context";
import { useSession } from "@/lib/session-context";

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Responsável",
  ADMIN: "Administrador",
  MEMBER: "Operador",
};

function OrganizationPicker() {
  const router = useRouter();
  const { organizations, loading, setOrganization, reload, error } =
    useOrganization();
  const { logout } = useSession();

  const choose = (id: string) => {
    setOrganization(id);
    // `/entrada` resolve unidades (0 / 1 / N) antes de liberar o app.
    router.replace("/entrada");
  };

  return (
    <main className="flex min-h-svh flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="rounded-2xl border bg-card px-8 py-10 shadow-sm">
          <Logo variant="full" className="mb-8 h-8" brandGradient="primary" />

          <div className="mb-6">
            <h1 className="text-xl font-semibold tracking-tight">
              Escolha a empresa
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Você tem acesso a mais de uma empresa. É possível trocar depois,
              pelo menu do topo.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 px-1 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span>Carregando suas empresas…</span>
            </div>
          ) : error ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Não foi possível carregar suas empresas.
              </p>
              <Button type="button" variant="outline" onClick={reload}>
                Tentar de novo
              </Button>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {organizations.map((organization) => (
                <li key={organization.id}>
                  <button
                    type="button"
                    onClick={() => choose(organization.id)}
                    className="flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/50"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="size-4 text-primary" aria-hidden />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium">
                        {organization.displayName}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {ROLE_LABEL[organization.role] ?? organization.role} ·{" "}
                        {organization.branchCount === 1
                          ? "1 unidade"
                          : `${organization.branchCount} unidades`}
                      </span>
                    </span>
                    <ChevronRight
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-8 border-t pt-4">
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => void logout()}
            >
              Sair da conta
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SelecionarOrganizacaoPage() {
  return (
    <RequireAuth>
      <OrganizationPicker />
    </RequireAuth>
  );
}
