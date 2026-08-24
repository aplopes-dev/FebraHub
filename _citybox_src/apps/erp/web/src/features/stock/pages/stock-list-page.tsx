"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import AddIcon from "@mui/icons-material/Add";
import { toast } from "@citybox/mui";
import { Button, PageHeader, SearchInput } from "@citybox/mui";
import { ListPagePanel } from "@/components/ui/data-table";
import { ListLoadErrorAlert } from "@/components/ui/list-page";
import { StockListTable } from "@/features/stock/components/stock-list-table";
import { useStockList } from "@/features/stock/hooks/use-stock-list";
import { useDeleteStockMutation } from "@/features/stock/hooks/use-stock-mutations";
import { canRemoveStock, type Stock } from "@/features/stock/types/stock";

export function StockListPage() {
  const {
    search,
    setSearch,
    setPage,
    perPage,
    setPerPage,
    result,
    isLoading,
    isError,
    refresh,
  } = useStockList();
  const deleteMutation = useDeleteStockMutation();

  async function handleDelete(stock: Stock) {
    const removability = canRemoveStock(stock);
    if (!removability.removable) {
      toast.error(removability.reason ?? "Este estoque não pode ser excluído.");
      return;
    }
    await deleteMutation.mutateAsync(stock.id);
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        gap: 2,
      }}
    >
      <PageHeader
        sx={{ flexShrink: 0, mb: 0 }}
        title="Estoque"
        actions={
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <SearchInput
              size="small"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar estoques…"
              sx={{ width: { xs: 224, sm: 288 } }}
            />
            <Button
              component={Link}
              href="/estoque/novo"
              variant="contained"
              startIcon={<AddIcon />}
            >
              Novo estoque
            </Button>
          </Stack>
        }
      />

      <ListPagePanel>
        {isError ? (
          <ListLoadErrorAlert
            title="Não foi possível carregar os estoques"
            onRetry={() => void refresh()}
          />
        ) : (
          <StockListTable
            stocks={result.data}
            pageIndex={result.meta.page - 1}
            totalRowCount={result.meta.total}
            pageSize={perPage}
            onPageIndexChange={(pageIndex) => setPage(pageIndex + 1)}
            onPageSizeChange={setPerPage}
            onDelete={handleDelete}
            isLoading={isLoading}
          />
        )}
      </ListPagePanel>
    </Box>
  );
}
