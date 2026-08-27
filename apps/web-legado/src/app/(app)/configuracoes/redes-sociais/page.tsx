"use client";

/* Configuração Zernio (API key) — Configurações → Redes sociais.

   Quem configura precisa de `social.gerenciar`. A exibição das redes está
   no submenu Marketing (Visão geral, Publicar, …). */

import { Suspense } from "react";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { PainelSocial } from "@/components/social/PainelSocial";
import { TelaCarregando } from "@/components/shell/TelaCarregando";

export default function PaginaRedesSociaisConfig() {
  return (
    <GuardaPermissao permissoes={["social.gerenciar", "social.ver"]}>
      <Suspense fallback={<TelaCarregando />}>
        <PainelSocial />
      </Suspense>
    </GuardaPermissao>
  );
}
