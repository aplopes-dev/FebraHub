"use client";

/* Tela analítica de um indicador — rota própria (spec §16), com os filtros
   do hub herdados pela query string. */

import { Suspense, use } from "react";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { TelaIndicador } from "@/components/executivo/TelaIndicador";
import { TelaCarregando } from "@/components/shell/TelaCarregando";

export default function PaginaIndicador({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = use(params);
  return (
    <GuardaPermissao permissoes={["executivo.ver"]}>
      <Suspense fallback={<TelaCarregando />}>
        <TelaIndicador codigo={codigo} />
      </Suspense>
    </GuardaPermissao>
  );
}
