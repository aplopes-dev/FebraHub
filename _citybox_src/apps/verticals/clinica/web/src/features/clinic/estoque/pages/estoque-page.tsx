"use client";

import { Separator } from "@citybox/ui/atoms";

import { HeaderStock } from "../components/header-stock";
import { StockListing } from "../components/stock-listing";

/**
 * Página principal de Estoque da vertical clínica.
 *
 * Clone da feature de Estoque do OdontoTech rodando 100% com dados mockados
 * (sem backend). Formulários compostos com `@citybox/ui`; tabela via o
 * organism `DataTable` do design system.
 */
export function ClinicEstoquePage() {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
      <HeaderStock />
      <Separator />
      <StockListing />
    </div>
  );
}
