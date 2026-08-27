"use client";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import WarehouseOutlinedIcon from "@mui/icons-material/WarehouseOutlined";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { formatIsoDate } from "@/lib/date";
import type { ProductionOrder } from "@/features/production/types/production";

type ProductionOrderCardProps = {
  order: ProductionOrder;
  onClick?: () => void;
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR");
}

export function ProductionOrderCard({
  order,
  onClick,
}: ProductionOrderCardProps) {
  const isCompleted = order.status === "completed";
  const isCancelled = order.status === "cancelled";
  const quantity = isCompleted
    ? (order.producedQuantity ?? order.plannedQuantity)
    : order.plannedQuantity;
  const divergence = isCompleted
    ? (order.producedQuantity ?? 0) - order.plannedQuantity
    : 0;
  const sourceName = order.sourceStockName;
  const destinationName = order.destinationStockName;

  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      sx={{
        p: 1.5,
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
        "&:hover": onClick
          ? {
              transform: "translateY(-2px)",
              borderColor: "primary.main",
              boxShadow: 2,
            }
          : undefined,
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
            {order.productName}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {order.productSku}
          </Typography>
        </Box>
        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            alignItems: "center",
            flexShrink: 0,
            px: 0.75,
            py: 0.25,
            borderRadius: 1,
            bgcolor: "action.hover",
          }}
        >
          <Inventory2OutlinedIcon sx={{ fontSize: 14 }} aria-hidden />
          <Typography variant="caption" sx={{ fontWeight: 500 }}>
            {quantity} un
          </Typography>
        </Stack>
      </Stack>

      <Stack
        direction="row"
        spacing={0.5}
        sx={{ mt: 1.25, alignItems: "center", minWidth: 0, color: "text.secondary" }}
      >
        <WarehouseOutlinedIcon sx={{ fontSize: 14, flexShrink: 0 }} aria-hidden />
        <Typography variant="caption" noWrap>
          {sourceName}
        </Typography>
        <ArrowForwardIcon sx={{ fontSize: 12, flexShrink: 0 }} aria-hidden />
        <Typography variant="caption" noWrap>
          {destinationName}
        </Typography>
      </Stack>

      <Stack
        direction="row"
        spacing={1}
        sx={{
          mt: 1,
          pt: 1,
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: 1,
          borderColor: "divider",
        }}
      >
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", color: "text.secondary" }}>
          <CalendarMonthIcon sx={{ fontSize: 14, flexShrink: 0 }} aria-hidden />
          <Typography variant="caption">
            {isCancelled
              ? `Cancelado em ${formatDateTime(order.cancelledAt)}`
              : `Previsão ${formatIsoDate(order.expectedDate)}`}
          </Typography>
        </Stack>
        {isCompleted && divergence !== 0 ? (
          <Typography
            variant="caption"
            sx={{
              flexShrink: 0,
              fontWeight: 600,
              color: divergence > 0 ? "info.main" : "warning.main",
            }}
          >
            {divergence > 0 ? `+${divergence}` : divergence} un
          </Typography>
        ) : null}
      </Stack>
    </Paper>
  );
}
