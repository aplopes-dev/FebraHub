"use client";

/* Perfis de acesso — bloco Administração do menu. A porta é a permissão
   `perfis.gerenciar`; o guard aqui é UX, a API recusa de qualquer forma. */

import { Suspense } from "react";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { PainelPerfis } from "@/components/permissoes/PainelPerfis";
import { TelaCarregando } from "@/components/shell/TelaCarregando";

export default function PaginaPerfis() {
  return (
    <GuardaPermissao permissoes={["perfis.gerenciar"]}>
      <Suspense fallback={<TelaCarregando />}>
        <PainelPerfis />
      </Suspense>
    </GuardaPermissao>
  );
}
