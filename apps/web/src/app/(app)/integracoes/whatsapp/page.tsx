"use client";

/* Integrações → WhatsApp (conexão/QR) — operação de administração. */

import { Suspense } from "react";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { PainelWhatsApp } from "@/components/canais/PainelWhatsApp";
import { TelaCarregando } from "@/components/shell/TelaCarregando";

export default function PaginaWhatsApp() {
  return (
    <GuardaPermissao permissoes={["whatsapp.gerenciar"]}>
      <Suspense fallback={<TelaCarregando />}>
        <PainelWhatsApp />
      </Suspense>
    </GuardaPermissao>
  );
}
