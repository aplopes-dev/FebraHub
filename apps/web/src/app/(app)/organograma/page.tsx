"use client";

/* Organograma — rota estática do grupo Painéis, exclusiva da diretoria:
   o mesmo guarda do Executivo/Territorial (menu esconde, rota redireciona
   e a API recusa com 403 quem não é admin/geral — a segurança real é a do
   backend). */

import { Suspense } from "react";
import { GuardaExecutivo } from "@/components/executivo/GuardaExecutivo";
import { PainelOrganograma } from "@/components/organograma/PainelOrganograma";
import { TelaCarregando } from "@/components/shell/TelaCarregando";
import "@/app/organograma.css";

export default function PaginaOrganograma() {
  return (
    <GuardaExecutivo>
      <Suspense fallback={<TelaCarregando />}>
        <PainelOrganograma />
      </Suspense>
    </GuardaExecutivo>
  );
}
