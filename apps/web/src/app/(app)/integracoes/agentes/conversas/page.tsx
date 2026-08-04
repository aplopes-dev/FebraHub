"use client";

/* Integrações → Conversas: a central de atendimento com os agentes — o
   MESMO componente do crm-aplopes (teams-conversations-center), tema à
   parte. Deep-link ?c=<conversaId> abre a conversa direto (contrato da
   origem). Acesso: admin ou setor crm — o recorte da API (@ExigeSetor). */

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TeamsConversationsCenter } from "@/components/teams-widget/teams-conversations-center";
import { TelaCarregando } from "@/components/shell/TelaCarregando";
import { ehAdmin, pode, setoresVisiveis, usePerfil, useSessao } from "@/hooks/auth";
import { hubInicial } from "@/lib/hubs";

function Central() {
  const params = useSearchParams();
  return <TeamsConversationsCenter initialConversationId={params.get("c")} />;
}

export default function PaginaConversasAgentes() {
  const sessao = useSessao();
  const perfil = usePerfil(sessao);
  const router = useRouter();
  const dados = perfil.data;
  const liberado = !!dados && (ehAdmin(dados) || setoresVisiveis(dados).includes("crm"));

  useEffect(() => {
    if (!dados || liberado) return;
    const destino = hubInicial(setoresVisiveis(dados), pode(dados, "executivo.ver"));
    router.replace(destino ? `/${destino}` : "/");
  }, [dados, liberado, router]);

  if (!liberado) return <TelaCarregando />;
  return (
    <Suspense fallback={<TelaCarregando />}>
      <Central />
    </Suspense>
  );
}
