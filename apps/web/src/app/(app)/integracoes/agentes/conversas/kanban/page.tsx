"use client";

/* Integrações → Kanban: conversas dos agentes por etapa, com arrastar-e-
   soltar. Acesso: admin ou setor crm (mesmo recorte da API). */

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { KanbanConversas } from "@/components/canais/KanbanConversas";
import { TelaCarregando } from "@/components/shell/TelaCarregando";
import { ehAdmin, setoresDo, usePerfil, useSessao } from "@/hooks/auth";
import { hubInicial } from "@/lib/hubs";

export default function PaginaKanbanConversas() {
  const sessao = useSessao();
  const perfil = usePerfil(sessao);
  const router = useRouter();
  const dados = perfil.data;
  const liberado = !!dados && (ehAdmin(dados) || setoresDo(dados).includes("crm"));

  useEffect(() => {
    if (!dados || liberado) return;
    const destino = hubInicial(setoresDo(dados), ehAdmin(dados));
    router.replace(destino ? `/${destino}` : "/");
  }, [dados, liberado, router]);

  if (!liberado) return <TelaCarregando />;
  return (
    <Suspense fallback={<TelaCarregando />}>
      <KanbanConversas />
    </Suspense>
  );
}
