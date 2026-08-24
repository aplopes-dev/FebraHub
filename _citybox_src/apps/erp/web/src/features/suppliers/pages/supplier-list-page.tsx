"use client";

import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import AddIcon from "@mui/icons-material/Add";
import { Button, PageHeader, SearchInput } from "@citybox/mui";
import { ListPagePanel } from "@/components/ui/data-table";
import {
  ListLoadErrorAlert,
  ListPageShell,
} from "@/components/ui/list-page";
import { SupplierListTable } from "@/features/suppliers/components/supplier-list-table";
import { SupplierListTabs } from "@/features/suppliers/components/supplier-list-tabs";
import { useSupplierList } from "@/features/suppliers/hooks/use-supplier-list";
import {
  useDeleteSupplierMutation,
  useRestoreSupplierMutation,
} from "@/features/suppliers/hooks/use-supplier-mutations";
import type { Supplier } from "@/features/suppliers/types/supplier";

export function SupplierListPage() {
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
  } = useSupplierList();

  const deleteMutation = useDeleteSupplierMutation();
  const restoreMutation = useRestoreSupplierMutation();

  function handleEdit(supplier: Supplier) {
    router.push(`/estoque/fornecedores/${supplier.id}`);
  }

  return (
    <ListPageShell>
      <PageHeader
        sx={{ flexShrink: 0, mb: 0 }}
        title="Fornecedores"
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
              onClick={() => router.push("/estoque/fornecedores/novo")}
              startIcon={<AddIcon />}
            >
              Novo fornecedor
            </Button>
          </Stack>
        }
      />

      <ListPagePanel>
        <Box sx={{ flexShrink: 0 }}>
          <SupplierListTabs
            value={tab}
            onValueChange={setTab}
            counts={result.tabCounts}
          />
        </Box>

        {isError ? (
          <ListLoadErrorAlert
            title="Não foi possível carregar os fornecedores"
            message={
              error instanceof Error ? error.message : "Erro inesperado"
            }
            onRetry={refresh}
          />
        ) : (
          <SupplierListTable
            suppliers={result.data}
            pageIndex={result.meta.page - 1}
            pageCount={result.meta.totalPages}
            totalRowCount={result.meta.total}
            pageSize={perPage}
            isFetching={isFetching}
            onPageIndexChange={(pageIndex) => setPage(pageIndex + 1)}
            onPageSizeChange={setPerPage}
            onRowClick={tab === "deleted" ? undefined : handleEdit}
            onEdit={handleEdit}
            onDelete={(supplier) => deleteMutation.mutate(supplier.id)}
            onRestore={(supplier) => restoreMutation.mutate(supplier.id)}
          />
        )}
      </ListPagePanel>
    </ListPageShell>
  );
}
