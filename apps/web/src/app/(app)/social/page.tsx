"use client";

/* Redes sociais (Zernio) — bloco Painéis do menu.

   Permissão `social.ver` abre; publicar/responder pede `social.publicar` e
   configurar pede `social.gerenciar`. O recorte NÃO é por setor: a conta do
   Zernio é uma só, das redes oficiais da Febracis Salvador. */

import { Suspense } from "react";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { PainelSocial } from "@/components/social/PainelSocial";
import { TelaCarregando } from "@/components/shell/TelaCarregando";

export default function PaginaSocial() {
  return (
    <GuardaPermissao permissoes={["social.ver"]}>
      <Suspense fallback={<TelaCarregando />}>
        <PainelSocial />
      </Suspense>
    </GuardaPermissao>
  );
}
