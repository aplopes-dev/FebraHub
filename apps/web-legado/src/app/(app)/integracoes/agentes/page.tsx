"use client";

/* Integrações → Agentes de IA. Admin vê pareamento + conversas; quem é do
   setor crm vê as conversas (a API recorta de qualquer forma). */

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PainelAgentes } from "@/components/canais/PainelAgentes";
import { TelaCarregando } from "@/components/shell/TelaCarregando";
import { pode, setoresVisiveis, usePerfil, useSessao } from "@/hooks/auth";
import { hubInicial } from "@/lib/hubs";

export default function PaginaAgentes() {
  const sessao = useSessao();
  const perfil = usePerfil(sessao);
  const router = useRouter();
  const dados = perfil.data;
  // `admin` aqui significa "pode parear/desparear", não o papel: é o que o
  // PainelAgentes usa para mostrar o bloco de conexão.
  const admin = pode(dados, "agentes.gerenciar");
  const liberado = !!dados && (admin || setoresVisiveis(dados).includes("crm"));

  useEffect(() => {
    if (!dados || liberado) return;
    const destino = hubInicial(setoresVisiveis(dados), pode(dados, "executivo.ver"));
    router.replace(destino ? `/${destino}` : "/");
  }, [dados, liberado, router]);

  if (!liberado) return <TelaCarregando />;
  return (
    <Suspense fallback={<TelaCarregando />}>
      <PainelAgentes admin={admin} />
    </Suspense>
  );
}
