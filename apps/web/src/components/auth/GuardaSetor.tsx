"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { TelaCarregando } from "@/components/shell/TelaCarregando";
import { ehAdmin, pode, setoresVisiveis, usePerfil, useSessao } from "@/hooks/auth";
import { hubInicial } from "@/lib/hubs";

/** UX: redireciona quem não é do setor (a API ainda bloqueia com 403). */
export function GuardaSetor({
  setor,
  children,
}: {
  setor: string;
  children: ReactNode;
}) {
  const sessao = useSessao();
  const perfil = usePerfil(sessao);
  const router = useRouter();
  const dados = perfil.data;
  const liberado = !dados
    ? false
    : ehAdmin(dados) || setoresVisiveis(dados).includes(setor);

  useEffect(() => {
    if (!dados || liberado) return;
    const destino = hubInicial(setoresVisiveis(dados), pode(dados, "executivo.ver"));
    router.replace(destino ? `/${destino}` : "/");
  }, [dados, liberado, router]);

  if (!dados || !liberado) return <TelaCarregando />;
  return <>{children}</>;
}
