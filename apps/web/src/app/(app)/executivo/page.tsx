"use client";

/* Rota estática do Hub Executivo. Ela ganha da rota dinâmica [hub] para
   /executivo — é o que permite às subrotas (indicadores/[codigo], metas)
   existirem debaixo do mesmo caminho. */

import { Suspense } from "react";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { PainelExecutivo } from "@/components/executivo/PainelExecutivo";
import { TelaCarregando } from "@/components/shell/TelaCarregando";

export default function PaginaExecutivo() {
  return (
    <GuardaPermissao permissoes={["executivo.ver"]}>
      {/* useSearchParams (filtros na URL) exige um limite de Suspense. */}
      <Suspense fallback={<TelaCarregando />}>
        <PainelExecutivo />
      </Suspense>
    </GuardaPermissao>
  );
}
