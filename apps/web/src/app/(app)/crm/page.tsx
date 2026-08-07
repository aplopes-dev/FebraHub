"use client";

/* CRM — rota estática (aba, cliente e negócio vivem na query string).
   Guarda de UX: setor 'crm' ou admin; a API recusa 403 de qualquer forma. */

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HubCrm } from "@/components/crm/HubCrm";
import { TelaCarregando } from "@/components/shell/TelaCarregando";
import { ehAdmin, pode, setoresVisiveis, usePerfil, useSessao } from "@/hooks/auth";
import { hubInicial } from "@/lib/hubs";

export default function PaginaCrm() {
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
      <HubCrm />
    </Suspense>
  );
}
