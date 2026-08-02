"use client";

/* Integrações → Conversas: a página completa de atendimento com os agentes.
   Acesso: admin ou setor crm — o mesmo recorte da API (@ExigeSetor('crm')). */

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ConversasAgentes } from "@/components/canais/ConversasAgentes";
import { TelaCarregando } from "@/components/shell/TelaCarregando";
import { ehAdmin, setoresDo, usePerfil, useSessao } from "@/hooks/auth";
import { hubInicial } from "@/lib/hubs";

export default function PaginaConversasAgentes() {
  const sessao = useSessao();
  const perfil = usePerfil(sessao);
  const router = useRouter();
  const dados = perfil.data;
  const admin = !!dados && ehAdmin(dados);
  const liberado = !!dados && (admin || setoresDo(dados).includes("crm"));

  useEffect(() => {
    if (!dados || liberado) return;
    const destino = hubInicial(setoresDo(dados), ehAdmin(dados));
    router.replace(destino ? `/${destino}` : "/");
  }, [dados, liberado, router]);

  if (!liberado) return <TelaCarregando />;
  return (
    <Suspense fallback={<TelaCarregando />}>
      <ConversasAgentes admin={admin} />
    </Suspense>
  );
}
