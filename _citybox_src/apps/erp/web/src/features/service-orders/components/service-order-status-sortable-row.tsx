"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import Box from "@mui/material/Box";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import { Badge, Button, Menu, MenuItem } from "@citybox/mui";
import { SERVICE_ORDER_STATUS_BASE_TYPE_LABELS } from "@/features/service-orders/types/service-order-status";
import type { ServiceOrderStatus } from "@/features/service-orders/types/service-order-status";

type ServiceOrderStatusSortableRowProps = {
  status: ServiceOrderStatus;
  onEdit: (status: ServiceOrderStatus) => void;
  onDelete: (status: ServiceOrderStatus) => void;
};

const VARIANT_SX: Record<ServiceOrderStatus["variant"], SxProps<Theme>> = {
  default: {
    borderColor: (theme) => alpha(theme.palette.primary.main, 0.35),
    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
    color: "primary.dark",
    fontWeight: 500,
  },
  secondary: {
    borderColor: "divider",
    bgcolor: "muted.main",
    color: "text.secondary",
    fontWeight: 500,
  },
  outline: {
    borderColor: "divider",
    bgcolor: "transparent",
    color: "text.primary",
    fontWeight: 500,
  },
  destructive: {
    borderColor: (theme) => alpha(theme.palette.error.main, 0.35),
    bgcolor: "error.light",
    color: "error.dark",
    fontWeight: 500,
  },
};

export function ServiceOrderStatusSortableRow({
  status,
  onEdit,
  onDelete,
}: ServiceOrderStatusSortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: status.id });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  return (
    <Box
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      sx={{
        zIndex: isDragging ? 1 : 0,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 1.5,
        py: 1.5,
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        bgcolor: "background.paper",
        opacity: isDragging ? 0.85 : 1,
        boxShadow: isDragging ? 2 : 0,
      }}
    >
      <Button
        type="button"
        variant="text"
        aria-label={`Reordenar ${status.name}`}
        sx={{
          minWidth: 32,
          px: 0.5,
          cursor: "grab",
          color: "text.secondary",
          "&:active": { cursor: "grabbing" },
        }}
        {...attributes}
        {...listeners}
      >
        <DragIndicatorIcon sx={{ fontSize: 16 }} aria-hidden />
      </Button>

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
          {status.name}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Etapa: {SERVICE_ORDER_STATUS_BASE_TYPE_LABELS[status.baseType]}
        </Typography>
      </Box>

      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
        <Badge
          label={status.name}
          variant="outlined"
          size="small"
          sx={VARIANT_SX[status.variant]}
        />
        <Badge
          label={status.active ? "Ativo" : "Inativo"}
          variant="outlined"
          size="small"
          sx={
            status.active
              ? VARIANT_SX.default
              : {
                  borderColor: "divider",
                  bgcolor: "transparent",
                  color: "text.secondary",
                  fontWeight: 500,
                }
          }
        />
      </Stack>

      <Button
        type="button"
        variant="text"
        aria-label={`Ações de ${status.name}`}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{ minWidth: 32, px: 0.5 }}
      >
        <MoreHorizIcon sx={{ fontSize: 16 }} />
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { minWidth: 160 } } }}
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onEdit(status);
          }}
        >
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onDelete(status);
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon sx={{ color: "error.main" }}>
            <DeleteOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Excluir</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}
