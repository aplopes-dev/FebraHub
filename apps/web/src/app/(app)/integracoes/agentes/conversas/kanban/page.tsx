"use client";

/* Integrações → Kanban: conversas dos agentes por status — o MESMO board do
   crm-aplopes (teams-kanban-board), tema à parte. Acesso: admin ou setor
   crm (mesmo recorte da API). */

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TeamsKanbanBoard } from "@/components/teams-widget/teams-kanban-board";
import { TelaCarregando } from "@/components/shell/TelaCarregando";
import { ehAdmin, pode, setoresVisiveis, usePerfil, useSessao } from "@/hooks/auth";
import { hubInicial } from "@/lib/hubs";

export default function PaginaKanbanConversas() {
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
      <TeamsKanbanBoard />
    </Suspense>
  );
}
