"use client";

/* Rota estática do Hub Executivo. Ela ganha da rota dinâmica [hub] para
   /executivo — é o que permite às subrotas (indicadores/[codigo], metas)
   existirem debaixo do mesmo caminho. */

import { Suspense } from "react";
import { GuardaExecutivo } from "@/components/executivo/GuardaExecutivo";
import { PainelExecutivo } from "@/components/executivo/PainelExecutivo";
import { TelaCarregando } from "@/components/shell/TelaCarregando";

export default function PaginaExecutivo() {
  return (
    <GuardaExecutivo>
      {/* useSearchParams (filtros na URL) exige um limite de Suspense. */}
      <Suspense fallback={<TelaCarregando />}>
        <PainelExecutivo />
      </Suspense>
    </GuardaExecutivo>
  );
}
