"use client";

/* Configuração fiscal (emitente, certificado A1, CSC) — Configurações → Fiscal.
   Quem configura precisa de `fiscal.gerenciar`; quem só emite (`fiscal.emitir`)
   enxerga o estado mas não altera. */

import { Suspense } from "react";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { PainelFiscal } from "@/components/fiscal/PainelFiscal";
import { TelaCarregando } from "@/components/shell/TelaCarregando";

export default function PaginaFiscalConfig() {
  return (
    <GuardaPermissao permissoes={["fiscal.gerenciar", "fiscal.emitir"]}>
      <Suspense fallback={<TelaCarregando />}>
        <PainelFiscal />
      </Suspense>
    </GuardaPermissao>
  );
}
