"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Box, Paper, ScrollArea, Stack, Typography } from "@/ui";
import { EntityFormHeader } from "@/components/ui/form";
import { InventoryDetailTable } from "@/features/stock-inventory/components/inventory-detail-table";
import { useInventoryQuery } from "@/features/stock-inventory/hooks/use-inventory-queries";
import { countDivergences } from "@/features/stock-inventory/types/inventory";

type InventoryDetailPageProps = {
  stockId: string;
  inventoryId: string;
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR");
}

export function InventoryDetailPage({
  stockId,
  inventoryId,
}: InventoryDetailPageProps) {
  const router = useRouter();
  const inventoryQuery = useInventoryQuery(inventoryId);
  const inventory = inventoryQuery.data;

  const isValid =
    inventory != null && inventory.stockId === stockId;
  const divergentCount = useMemo(
    () =>
      inventory
        ? (inventory.divergentCount ?? countDivergences(inventory.lines))
        : 0,
    [inventory],
  );

  useEffect(() => {
    if (inventoryQuery.isError || (inventoryQuery.isSuccess && !isValid)) {
      router.replace(`/estoque/${stockId}/inventario`);
    }
  }, [
    inventoryQuery.isError,
    inventoryQuery.isSuccess,
    isValid,
    router,
    stockId,
  ]);

  if (inventoryQuery.isLoading || !inventory || !isValid) return null;

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
          <EntityFormHeader
            title={inventory.name}
            subtitle="Inventário"
            backHref={`/estoque/${stockId}/inventario`}
          />

          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(3, minmax(0, 1fr))",
              },
            }}
          >
            <InfoCard
              label="Finalizado em"
              value={formatDateTime(
                inventory.completedAt ?? inventory.createdAt,
              )}
            />
            <InfoCard
              label="Produtos contados"
              value={String(inventory.itemsCount ?? inventory.lines.length)}
            />
            <InfoCard
              label="Itens com divergência"
              value={String(divergentCount)}
              tone={divergentCount > 0 ? "warning" : "default"}
            />
          </Box>

          <InventoryDetailTable lines={inventory.lines} />
        </Stack>
      </ScrollArea>
    </Box>
  );
}

function InfoCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warning";
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 3,
        bgcolor: "background.paper",
      }}
    >
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {label}
      </Typography>
      <Typography
        variant="h6"
        sx={{
          mt: 0.5,
          fontWeight: 700,
          color: tone === "warning" ? "warning.main" : "text.primary",
        }}
      >
        {value}
      </Typography>
    </Paper>
  );
}
