"use client";

/* Memória institucional (GBrain) — bloco Configurações do menu.
   Permissão `brain.ver`; o que a pessoa alcança dentro dela é decidido pela
   credencial que a API provisiona, não por esta tela. */

import { Suspense } from "react";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { PainelBrain } from "@/components/brain/PainelBrain";
import { TelaCarregando } from "@/components/shell/TelaCarregando";

export default function PaginaBrain() {
  return (
    <GuardaPermissao permissoes={["brain.ver"]}>
      <Suspense fallback={<TelaCarregando />}>
        <PainelBrain />
      </Suspense>
    </GuardaPermissao>
  );
}
