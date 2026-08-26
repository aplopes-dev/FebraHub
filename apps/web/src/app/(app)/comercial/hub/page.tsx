"use client";

/* Rota dedicada do Hub Comercial (pódio de consultoras, evolução do
   faturamento e placar). O `/comercial` "cru" é uma rota ESTÁTICA
   (app/(app)/comercial/page.tsx, o módulo de pipeline/leads/vendas) e, no
   Next.js, uma rota estática vence a dinâmica `/[hub]` — por isso o
   HubComercial não era alcançável por lá. Aqui damos a ele um endereço
   próprio (`/comercial/hub`) que o menu aponta como "Visão geral". */

import { HubComercial } from "@/components/hubs/HubComercial";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";

export default function PaginaHubComercial() {
  return (
    <GuardaPermissao
      permissoes={[
        "comercial.ver",
        "comercial.operar",
        "comercial.gerenciar",
        "comercial.vendas.aprovar",
        "comercial.relatorios",
      ]}
    >
      <HubComercial />
    </GuardaPermissao>
  );
}
