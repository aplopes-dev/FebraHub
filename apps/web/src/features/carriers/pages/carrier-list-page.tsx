"use client";

import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import AddIcon from "@mui/icons-material/Add";
import { Button, PageHeader, SearchInput } from "@/ui";
import { ListPagePanel } from "@/components/ui/data-table";
import {
  ListLoadErrorAlert,
  ListPageShell,
} from "@/components/ui/list-page";
import { CarrierListTable } from "@/features/carriers/components/carrier-list-table";
import { CarrierListTabs } from "@/features/carriers/components/carrier-list-tabs";
import { useCarrierList } from "@/features/carriers/hooks/use-carrier-list";
import {
  useDeleteCarrierMutation,
  useRestoreCarrierMutation,
} from "@/features/carriers/hooks/use-carrier-mutations";
import type { Carrier } from "@/features/carriers/types/carrier";

export function CarrierListPage() {
  const router = useRouter();
  const {
    tab,
    setTab,
    search,
    setSearch,
    setPage,
    perPage,
    setPerPage,
    result,
    isFetching,
    isError,
    error,
    refresh,
  } = useCarrierList();

  const deleteMutation = useDeleteCarrierMutation();
  const restoreMutation = useRestoreCarrierMutation();

  function handleEdit(carrier: Carrier) {
    router.push(`/estoque/transportadoras/${carrier.id}`);
  }

  return (
    <ListPageShell>
      <PageHeader
        sx={{ flexShrink: 0, mb: 0 }}
        title="Transportadoras"
        actions={
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <SearchInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, CNPJ ou CPF…"
              sx={{ width: { xs: 224, sm: 320 } }}
            />
            <Button
              type="button"
              variant="contained"
              onClick={() => router.push("/estoque/transportadoras/novo")}
              startIcon={<AddIcon />}
            >
              Nova transportadora
            </Button>
          </Stack>
        }
      />

      <ListPagePanel>
        <Box sx={{ flexShrink: 0 }}>
          <CarrierListTabs
            value={tab}
            onValueChange={setTab}
            counts={result.tabCounts}
          />
        </Box>

        {isError ? (
          <ListLoadErrorAlert
            title="Não foi possível carregar as transportadoras"
            message={
              error instanceof Error ? error.message : "Erro inesperado"
            }
            onRetry={refresh}
          />
        ) : (
          <CarrierListTable
            carriers={result.data}
            pageIndex={result.meta.page - 1}
            pageCount={result.meta.totalPages}
            totalRowCount={result.meta.total}
            pageSize={perPage}
            isFetching={isFetching}
            onPageIndexChange={(pageIndex) => setPage(pageIndex + 1)}
            onPageSizeChange={setPerPage}
            onRowClick={tab === "deleted" ? undefined : handleEdit}
            onEdit={handleEdit}
            onDelete={(carrier) => deleteMutation.mutate(carrier.id)}
            onRestore={(carrier) => restoreMutation.mutate(carrier.id)}
          />
        )}
      </ListPagePanel>
    </ListPageShell>
  );
}
