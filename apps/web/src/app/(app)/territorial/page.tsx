"use client";

/* Inteligência Territorial — módulo do hub.aplopes.com integrado ao
   FebraHub. Rota estática do grupo Painéis, exclusiva da diretoria:
   o mesmo guarda do Executivo (menu esconde, rota redireciona e a API
   recusa com 403 quem não é admin/geral — a segurança real é a do
   backend). */

import { Suspense } from "react";
import { GuardaExecutivo } from "@/components/executivo/GuardaExecutivo";
import { PainelTerritorial } from "@/components/territorial/PainelTerritorial";
import { TelaCarregando } from "@/components/shell/TelaCarregando";
// Escopo visual .tio (tokens do hub original nos dois temas do FebraHub).
import "@/app/territorial.css";

export default function PaginaTerritorial() {
  return (
    <GuardaExecutivo>
      <Suspense fallback={<TelaCarregando />}>
        <PainelTerritorial />
      </Suspense>
    </GuardaExecutivo>
  );
}
