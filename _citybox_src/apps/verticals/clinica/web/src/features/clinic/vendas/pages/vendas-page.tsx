"use client";

import { SalesBoard } from "../components/sales-board";

/**
 * Página principal de Vendas (CRM de funil/oportunidades) da vertical clínica.
 *
 * Clone da feature de Vendas do OdontoTech rodando 100% com dados mockados
 * (sem backend). O kanban usa o componente do design system `@citybox/ui`.
 */
export function ClinicVendasPage() {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <SalesBoard />
    </div>
  );
}
