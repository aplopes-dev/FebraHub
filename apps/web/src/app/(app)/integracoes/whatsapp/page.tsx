"use client";

/* Integrações → WhatsApp (conexão/QR) — operação de administração. */

import { Suspense } from "react";
import { GuardaExecutivo } from "@/components/executivo/GuardaExecutivo";
import { PainelWhatsApp } from "@/components/canais/PainelWhatsApp";
import { TelaCarregando } from "@/components/shell/TelaCarregando";

export default function PaginaWhatsApp() {
  return (
    <GuardaExecutivo>
      <Suspense fallback={<TelaCarregando />}>
        <PainelWhatsApp />
      </Suspense>
    </GuardaExecutivo>
  );
}
