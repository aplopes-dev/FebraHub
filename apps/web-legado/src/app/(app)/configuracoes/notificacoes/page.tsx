"use client";

/* Comunicados — bloco Administração do menu, permissão `notificacoes.enviar`.
   A caixa de entrada de cada pessoa fica no sino do cabeçalho; aqui é só o
   lado de quem envia. */

import { Suspense } from "react";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { PainelComunicados } from "@/components/notificacoes/PainelComunicados";
import { TelaCarregando } from "@/components/shell/TelaCarregando";

export default function PaginaComunicados() {
  return (
    <GuardaPermissao permissoes={["notificacoes.enviar"]}>
      <Suspense fallback={<TelaCarregando />}>
        <PainelComunicados />
      </Suspense>
    </GuardaPermissao>
  );
}
