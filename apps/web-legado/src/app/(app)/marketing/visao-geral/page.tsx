"use client";

import { Suspense } from "react";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { GuardaSocial } from "@/components/social/GuardaSocial";
import { AbaVisao } from "@/components/social/AbaVisao";
import { TelaCarregando } from "@/components/shell/TelaCarregando";

export default function PaginaVisaoGeralRedes() {
  return (
    <GuardaPermissao permissoes={["social.ver"]}>
      <Suspense fallback={<TelaCarregando />}>
        <GuardaSocial>
          <AbaVisao />
        </GuardaSocial>
      </Suspense>
    </GuardaPermissao>
  );
}
