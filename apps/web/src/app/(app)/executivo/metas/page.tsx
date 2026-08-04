"use client";

import { Suspense } from "react";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { TelaMetas } from "@/components/executivo/TelaMetas";
import { TelaCarregando } from "@/components/shell/TelaCarregando";

export default function PaginaMetas() {
  return (
    <GuardaPermissao permissoes={["executivo.metas"]}>
      <Suspense fallback={<TelaCarregando />}>
        <TelaMetas />
      </Suspense>
    </GuardaPermissao>
  );
}
