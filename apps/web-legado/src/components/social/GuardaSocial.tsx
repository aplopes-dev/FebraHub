"use client";

/* Antes de abrir qualquer tela de redes: confirma se a chave Zernio existe.
   Sem chave, manda para Configurações → Redes sociais. */

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { pode, usePerfil, useSessao } from "@/hooks/auth";
import { configSocial } from "@/services/api/social";
import { SemChave } from "./SemChave";

export function GuardaSocial({ children }: { children: ReactNode }) {
  const router = useRouter();
  const perfil = usePerfil(useSessao()).data ?? null;
  const config = useQuery({
    queryKey: ["social-config"],
    queryFn: configSocial,
    staleTime: 60_000,
  });

  if (config.isPending || (!config.data?.temChave && !config.isError)) {
    return (
      <SemChave
        carregando={config.isPending}
        podeConfigurar={pode(perfil, "social.gerenciar")}
        aoConfigurar={() => router.push("/configuracoes/redes-sociais")}
        mostrarConfig={false}
      >
        {null}
      </SemChave>
    );
  }

  return <>{children}</>;
}
