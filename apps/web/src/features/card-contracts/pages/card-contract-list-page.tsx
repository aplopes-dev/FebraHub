"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Link from "next/link";
import AddIcon from "@mui/icons-material/Add";
import { Button, PageHeader, SearchInput } from "@/ui";
import { ListPagePanel } from "@/components/ui/data-table";
import {
  ListLoadErrorAlert,
  ListPageShell,
} from "@/components/ui/list-page";
import { CardContractListTable } from "@/features/card-contracts/components/card-contract-list-table";
import { CardContractListTabs } from "@/features/card-contracts/components/card-contract-list-tabs";
import { useCardContractList } from "@/features/card-contracts/hooks/use-card-contract-list";
import {
  useDeleteCardContractMutation,
  useRestoreCardContractMutation,
} from "@/features/card-contracts/hooks/use-card-contract-mutations";

export function CardContractListPage() {
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
  } = useCardContractList();

  const deleteMutation = useDeleteCardContractMutation();
  const restoreMutation = useRestoreCardContractMutation();

  return (
    <ListPageShell>
      <PageHeader
        sx={{ flexShrink: 0, mb: 0 }}
        title="Contratos de cartões e outros"
        actions={
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <SearchInput
              size="small"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar contratos…"
              sx={{ width: { xs: "100%", sm: 224, md: 288 } }}
            />
            <Button
              component={Link}
              href="/financas/contratos-de-cartoes-e-outros/novo"
              variant="contained"
              startIcon={<AddIcon fontSize="small" />}
            >
              Novo contrato
            </Button>
          </Stack>
        }
      />

      <ListPagePanel>
        <Box sx={{ flexShrink: 0 }}>
          <CardContractListTabs
            value={tab}
            onValueChange={setTab}
            counts={result.tabCounts}
          />
        </Box>

        {isError ? (
          <ListLoadErrorAlert
            title="Não foi possível carregar os contratos"
            message={
              error instanceof Error ? error.message : "Erro inesperado"
            }
            onRetry={refresh}
          />
        ) : (
          <CardContractListTable
            contracts={result.data}
            pageIndex={result.meta.page - 1}
            pageCount={result.meta.totalPages}
            totalRowCount={result.meta.total}
            pageSize={perPage}
            isFetching={isFetching}
            onPageIndexChange={(pageIndex) => setPage(pageIndex + 1)}
            onPageSizeChange={setPerPage}
            onDelete={(contract) => deleteMutation.mutateAsync(contract.id)}
            onRestore={(contract) => restoreMutation.mutateAsync(contract.id)}
          />
        )}
      </ListPagePanel>
    </ListPageShell>
  );
}
