import type { SxProps, Theme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import type { SaleOrderStatus } from "@/features/sales-orders/types/sale-order";

export const SALE_ORDER_STATUS_ORDER: SaleOrderStatus[] = [
  "open",
  "closed",
  "cancelled",
  "preparing",
  "delivering",
  "reserved",
  "waiting",
  "pickup",
];

export const SALE_ORDER_STATUS_LABELS: Record<SaleOrderStatus, string> = {
  open: "Aberto",
  closed: "Fechado",
  cancelled: "Cancelado",
  preparing: "Em preparação",
  delivering: "Em entrega",
  reserved: "Reservado",
  waiting: "Aguardando",
  pickup: "Retirada",
};

type StatusTone = "info" | "success" | "error" | "warning";

function semanticBadgeSx(tone: StatusTone): SxProps<Theme> {
  return {
    borderColor: (theme) => alpha(theme.palette[tone].main, 0.35),
    bgcolor: `${tone}.light`,
    color: `${tone}.dark`,
    fontWeight: 500,
  };
}

/** `sx` do Badge na tabela. */
export const SALE_ORDER_STATUS_BADGE_SX: Record<
  SaleOrderStatus,
  SxProps<Theme>
> = {
  open: semanticBadgeSx("info"),
  closed: semanticBadgeSx("success"),
  cancelled: semanticBadgeSx("error"),
  preparing: semanticBadgeSx("warning"),
  delivering: {
    borderColor: (theme) => alpha(theme.palette.secondary?.main ?? theme.palette.info.main, 0.35),
    bgcolor: (theme) => alpha(theme.palette.secondary?.main ?? theme.palette.info.main, 0.12),
    color: (theme) => theme.palette.secondary?.dark ?? theme.palette.info.dark,
    fontWeight: 500,
  },
  reserved: {
    borderColor: (theme) => alpha(theme.palette.info.main, 0.45),
    bgcolor: (theme) => alpha(theme.palette.info.main, 0.1),
    color: "info.dark",
    fontWeight: 500,
  },
  waiting: semanticBadgeSx("warning"),
  pickup: semanticBadgeSx("success"),
};

/** Cor da bolinha no submenu Alterar status (token MUI). */
export const SALE_ORDER_STATUS_DOT_COLOR: Record<SaleOrderStatus, string> = {
  open: "info.main",
  closed: "success.main",
  cancelled: "error.main",
  preparing: "warning.main",
  delivering: "secondary.main",
  reserved: "info.light",
  waiting: "warning.dark",
  pickup: "success.dark",
};
