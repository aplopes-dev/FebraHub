"use client";

import { Suspense } from "react";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { GuardaSocial } from "@/components/social/GuardaSocial";
import { AbaMensagens } from "@/components/social/AbaMensagens";
import { TelaCarregando } from "@/components/shell/TelaCarregando";

export default function PaginaMensagensRedes() {
  return (
    <GuardaPermissao permissoes={["social.ver"]}>
      <Suspense fallback={<TelaCarregando />}>
        <GuardaSocial>
          <AbaMensagens />
        </GuardaSocial>
      </Suspense>
    </GuardaPermissao>
  );
}
