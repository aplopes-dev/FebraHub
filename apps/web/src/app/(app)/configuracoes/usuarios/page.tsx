"use client";

/* Usuários — bloco Administração do menu, permissão `usuarios.gerenciar`. */

import { Suspense } from "react";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { PainelUsuarios } from "@/components/permissoes/PainelUsuarios";
import { TelaCarregando } from "@/components/shell/TelaCarregando";

export default function PaginaUsuarios() {
  return (
    <GuardaPermissao permissoes={["usuarios.gerenciar"]}>
      <Suspense fallback={<TelaCarregando />}>
        <PainelUsuarios />
      </Suspense>
    </GuardaPermissao>
  );
}
