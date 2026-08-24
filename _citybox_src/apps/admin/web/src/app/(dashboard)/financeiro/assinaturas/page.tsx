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
import { SubscriptionsTable } from "@/features/financeiro/components/assinaturas/subscriptions-table";
import { SubscriptionsStats } from "@/features/financeiro/components/assinaturas/subscriptions-stats";
import { SUBSCRIPTIONS_FILTER_GROUPS } from "@/features/financeiro/components/assinaturas/subscriptions-filter";

const EMPTY_FILTERS = createEmptyValues(SUBSCRIPTIONS_FILTER_GROUPS);

export default function AssinaturasPage() {
  const [filters, setFilters] = useState<FilterValues>(EMPTY_FILTERS);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Assinaturas"
        description="Gestão de contratos recorrentes e planos da plataforma."
        actions={
          <>
            <SearchInput
              id="subscriptions-search"
              placeholder="Buscar cliente ou plano..."
              className="w-64"
            />
            <FilterPopover
              groups={SUBSCRIPTIONS_FILTER_GROUPS}
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

      <SubscriptionsStats />

      <FilterPills
        groups={SUBSCRIPTIONS_FILTER_GROUPS}
        values={filters}
        onValuesChange={setFilters}
      />

      <SubscriptionsTable filters={filters} />
    </div>
  );
}
