"use client";

import Link from "next/link";
import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import { Button, PageHeader, SearchInput } from "@citybox/mui";
import { ListPagePanel } from "@/components/ui/data-table";
import { ListLoadErrorAlert, ListPageShell } from "@/components/ui/list-page";
import { BranchListTable } from "@/features/branches/components/branch-list-table";
import { useBranchList } from "@/features/branches/hooks/use-branch-list";
import { useDeleteBranchMutation } from "@/features/branches/hooks/use-branch-mutations";

export function BranchListPage() {
  const {
    search,
    setSearch,
    perPage,
    setPage,
    setPerPage,
    result,
    selectedIds,
    toggleSelected,
    toggleSelectAllPage,
    allPageSelected,
    somePageSelected,
    isFetching,
    isError,
    error,
    refresh,
  } = useBranchList();

  const deleteMutation = useDeleteBranchMutation();

  return (
    <ListPageShell>
      <PageHeader
        sx={{ flexShrink: 0, mb: 0 }}
        title="Unidades e Filiais"
        actions={
          // Link (e não router.push): o nextjs-toploader intercepta o `<a>`.
          <Button
            component={Link}
            href="/configuracoes/unidades-filiais/nova"
            variant="contained"
            startIcon={<AddIcon />}
          >
            Nova filial
          </Button>
        }
      />

      <ListPagePanel>
        <Box sx={{ display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
          <SearchInput
            size="small"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Busque por nome, código ou CNPJ…"
            sx={{ width: { xs: "100%", sm: 380 } }}
          />
        </Box>

        {isError ? (
          <ListLoadErrorAlert
            title="Não foi possível carregar as unidades"
            message={error instanceof Error ? error.message : "Erro inesperado"}
            onRetry={refresh}
          />
        ) : (
          <BranchListTable
            branches={result.data}
            page={result.meta.page}
            perPage={perPage}
            total={result.meta.total}
            isFetching={isFetching}
            selectedIds={selectedIds}
            allPageSelected={allPageSelected}
            somePageSelected={somePageSelected}
            onToggleSelected={toggleSelected}
            onToggleSelectAllPage={toggleSelectAllPage}
            onPageChange={setPage}
            onPerPageChange={setPerPage}
            onDelete={(branch) => deleteMutation.mutateAsync(branch.id)}
          />
        )}
      </ListPagePanel>
    </ListPageShell>
  );
}
