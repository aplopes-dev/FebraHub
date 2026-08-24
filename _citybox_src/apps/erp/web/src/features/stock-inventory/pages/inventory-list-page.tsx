"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AddIcon from "@mui/icons-material/Add";
import { Box, Button, ScrollArea, Stack } from "@citybox/mui";
import { EntityFormHeader } from "@/components/ui/form";
import { ListLoadErrorAlert } from "@/components/ui/list-page";
import { useStockQuery } from "@/features/stock/hooks/use-stock-queries";
import { InventoryListTable } from "@/features/stock-inventory/components/inventory-list-table";
import { useInventoriesQuery } from "@/features/stock-inventory/hooks/use-inventory-queries";

type InventoryListPageProps = {
  stockId: string;
};

export function InventoryListPage({ stockId }: InventoryListPageProps) {
  const router = useRouter();
  const stockQuery = useStockQuery(stockId);
  const inventoriesQuery = useInventoriesQuery({
    stockId,
    page: 1,
    perPage: 100,
  });

  const stock = stockQuery.data;
  const inventories = inventoriesQuery.data?.data ?? [];

  useEffect(() => {
    if (stockQuery.isError) router.replace("/estoque");
  }, [stockQuery.isError, router]);

  if (stockQuery.isLoading || !stock) return null;

  return (
    <Box
      component="section"
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        height: "100%",
        mr: -3,
      }}
    >
      <ScrollArea sx={{ flex: 1, minHeight: 0 }}>
        <Stack spacing={3} sx={{ pr: 3, pb: 2 }}>
          <Stack
            direction="row"
            spacing={2}
            sx={{ alignItems: "flex-start", justifyContent: "space-between" }}
          >
            <EntityFormHeader
              title={stock.name}
              subtitle="Inventários"
              backHref={`/estoque/${stockId}`}
            />
            <Button
              type="button"
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ mt: 0.5, flexShrink: 0 }}
              onClick={() =>
                router.push(`/estoque/${stockId}/inventario/novo`)
              }
            >
              Novo inventário
            </Button>
          </Stack>

          {inventoriesQuery.isError ? (
            <ListLoadErrorAlert
              title="Não foi possível carregar o histórico de inventários"
              onRetry={() => void inventoriesQuery.refetch()}
            />
          ) : (
            <InventoryListTable
              inventories={inventories}
              onRowClick={(inventory) =>
                router.push(`/estoque/${stockId}/inventario/${inventory.id}`)
              }
            />
          )}
        </Stack>
      </ScrollArea>
    </Box>
  );
}
