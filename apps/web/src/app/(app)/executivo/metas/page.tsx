"use client";

import { Suspense } from "react";
import { GuardaExecutivo } from "@/components/executivo/GuardaExecutivo";
import { TelaMetas } from "@/components/executivo/TelaMetas";
import { TelaCarregando } from "@/components/shell/TelaCarregando";

export default function PaginaMetas() {
  return (
    <GuardaExecutivo>
      <Suspense fallback={<TelaCarregando />}>
        <TelaMetas />
      </Suspense>
    </GuardaExecutivo>
  );
}
