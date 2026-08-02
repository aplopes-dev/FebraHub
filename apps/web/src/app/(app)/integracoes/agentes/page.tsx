"use client";

/* Integrações → Agentes de IA. Admin vê pareamento + conversas; quem é do
   setor crm vê as conversas (a API recorta de qualquer forma). */

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PainelAgentes } from "@/components/canais/PainelAgentes";
import { TelaCarregando } from "@/components/shell/TelaCarregando";
import { ehAdmin, setoresDo, usePerfil, useSessao } from "@/hooks/auth";
import { hubInicial } from "@/lib/hubs";

export default function PaginaAgentes() {
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
      <PainelAgentes admin={admin} />
    </Suspense>
  );
}
