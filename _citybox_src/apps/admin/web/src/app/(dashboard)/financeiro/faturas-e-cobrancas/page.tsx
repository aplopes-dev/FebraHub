"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@citybox/ui/atoms";
import { SearchInput } from "@citybox/ui/molecules";
import {
  PageHeader,
  FilterPopover,
  FilterPills,
  createEmptyValues,
} from "@citybox/ui/organisms";
import type { FilterValues } from "@citybox/ui/organisms";
import { ReceivablesTable } from "@/features/financeiro/components/contas-a-receber/receivables-table";
import { ReceivablesStats } from "@/features/financeiro/components/contas-a-receber/receivables-stats";
import { RECEIVABLES_FILTER_GROUPS } from "@/features/financeiro/components/contas-a-receber/receivables-filter";
import { useDebouncedInvoicesSearch } from "@/features/financeiro/hooks/use-debounced-invoices-search";

const DEFAULT_FILTERS: FilterValues = {
  ...createEmptyValues(RECEIVABLES_FILTER_GROUPS),
  dueDate: {
    preset: "este-mes",
    date: null,
  },
};

export default function ContasAReceberPage() {
  const [filters, setFilters] = useState<FilterValues>(DEFAULT_FILTERS);
  const { search, setSearch, apiSearch } = useDebouncedInvoicesSearch();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Faturas e Cobranças"
        description="Gestão de faturas e cobranças da plataforma."
        actions={
          <>
            <SearchInput
              id="receivables-search"
              placeholder="Buscar fatura ou cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
            <FilterPopover
              groups={RECEIVABLES_FILTER_GROUPS}
              values={filters}
              onValuesChange={setFilters}
            />
            <Button variant="outline">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </>
        }
      />

      <ReceivablesStats filters={filters} search={apiSearch} />

      <FilterPills
        groups={RECEIVABLES_FILTER_GROUPS}
        values={filters}
        onValuesChange={setFilters}
      />

      <ReceivablesTable filters={filters} search={apiSearch} />
    </div>
  );
}
