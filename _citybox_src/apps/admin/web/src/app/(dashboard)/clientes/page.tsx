"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Plus } from "lucide-react";
import { Button, Skeleton } from "@citybox/ui/atoms";
import { SearchInput } from "@citybox/ui/molecules";
import {
  PageHeader,
  FilterPopover,
  FilterPills,
  createEmptyValues,
  EmptyState,
} from "@citybox/ui/organisms";
import type { FilterValues } from "@citybox/ui/organisms";
import { extractApiMessage } from "@/lib/api-error";
import { StoresTable } from "@/features/stores/components/stores-table";
import { NewStoreDialog } from "@/features/stores/components/new-store-dialog";
import { STORES_FILTER_GROUPS } from "@/features/stores/components/stores-filter";
import { useDebouncedStoresSearch } from "@/features/stores/hooks/use-debounced-stores-search";
import { useStoresQuery } from "@/features/stores/hooks/use-stores-query";
import { useCreateStoreMutation } from "@/features/stores/hooks/use-store-mutations";
import { buildStoresListParams } from "@/features/stores/lib/stores-list-params";
import { mapFormToCreateStorePayload } from "@/features/stores/lib/map-form-to-store-payload";
import type { NewStoreFormData } from "@/features/stores/schemas/new-store-schema";

const EMPTY_FILTERS = createEmptyValues(STORES_FILTER_GROUPS);

export default function LojasPage() {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filters, setFilters] = useState<FilterValues>(EMPTY_FILTERS);
  const { search, setSearch, apiSearch } = useDebouncedStoresSearch();

  const listParams = useMemo(
    () => buildStoresListParams(apiSearch, filters),
    [apiSearch, filters],
  );

  const { lojas, isPending, isFetching, error, refetch } = useStoresQuery(listParams);
  const createMutation = useCreateStoreMutation();

  const isFiltering = isFetching && !isPending;

  const handleCreate = async (data: NewStoreFormData) => {
    const result = await createMutation.mutateAsync(mapFormToCreateStorePayload(data));
    setDialogOpen(false);
    router.push(`/clientes/${result.detail.id}`);
  };

  return (
    <div className="flex flex-col gap-6 p-2">
      <PageHeader
        title="Lojas"
        description="Busca, listagem e cadastro de lojas."
        actions={
          <>
            <div className="relative">
              <SearchInput
                id="lojas-search"
                placeholder="Buscar lojas..."
                className="w-64"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              {isFiltering ? (
                <Loader2 className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              ) : null}
            </div>
            <FilterPopover
              groups={STORES_FILTER_GROUPS}
              values={filters}
              onValuesChange={setFilters}
            />
            <Button id="lojas-nova-btn" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Nova Loja
            </Button>
          </>
        }
      />

      <FilterPills
        groups={STORES_FILTER_GROUPS}
        values={filters}
        onValuesChange={setFilters}
      />

      {error ? (
        <EmptyState
          icon={<AlertCircle className="size-10" />}
          title="Não foi possível carregar as lojas"
          description={extractApiMessage(error)}
          action={
            <Button variant="outline" onClick={() => void refetch()}>
              Tentar novamente
            </Button>
          }
        />
      ) : isPending ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className={isFiltering ? "opacity-60 transition-opacity" : undefined}>
          <StoresTable lojas={lojas} />
        </div>
      )}

      <NewStoreDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreate}
        isSaving={createMutation.isPending}
      />
    </div>
  );
}
