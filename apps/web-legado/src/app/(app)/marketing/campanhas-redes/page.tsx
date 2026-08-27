"use client";

import { Suspense } from "react";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { GuardaSocial } from "@/components/social/GuardaSocial";
import { AbaCampanhas } from "@/components/social/AbaCampanhas";
import { TelaCarregando } from "@/components/shell/TelaCarregando";

export default function PaginaCampanhasRedes() {
  return (
    <GuardaPermissao permissoes={["social.ver"]}>
      <Suspense fallback={<TelaCarregando />}>
        <GuardaSocial>
          <AbaCampanhas />
        </GuardaSocial>
      </Suspense>
    </GuardaPermissao>
  );
}
