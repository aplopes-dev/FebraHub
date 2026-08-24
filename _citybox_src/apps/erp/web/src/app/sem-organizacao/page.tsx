"use client";

import { Building2, RefreshCw } from "lucide-react";
import { Button } from "@citybox/ui/atoms";
import { Logo } from "@citybox/ui/molecules";
import { RequireAuth } from "@/components/auth/require-auth";
import { useOrganization } from "@/lib/organization-context";
import { useSession } from "@/lib/session-context";

/**
 * Estado vazio de quem entrou sem vínculo com nenhuma empresa.
 *
 * Toda rota de negócio exige uma organização ativa, então sem este aviso o
 * usuário cairia numa tela em branco sem entender o motivo.
 */
function NoOrganization() {
  const { session, logout } = useSession();
  const { reload, loading } = useOrganization();

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
            <Building2 className="size-5 text-muted-foreground" aria-hidden />
          </span>

          <h1 className="text-xl font-semibold tracking-tight">
            Nenhuma empresa vinculada
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sua conta
            {session?.user.email ? (
              <>
                {" "}
                (<span className="font-medium">{session.user.email}</span>)
              </>
            ) : null}{" "}
            entrou com sucesso, mas ainda não faz parte de nenhuma empresa.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Peça ao responsável pela empresa para cadastrar o seu e-mail como
            membro. Assim que isso for feito, atualize esta página.
          </p>

          <div className="mt-8 flex flex-col gap-2">
            <Button type="button" onClick={reload} disabled={loading}>
              <RefreshCw className="size-4" />
              Verificar novamente
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

export default function SemOrganizacaoPage() {
  return (
    <RequireAuth>
      <NoOrganization />
    </RequireAuth>
  );
}
