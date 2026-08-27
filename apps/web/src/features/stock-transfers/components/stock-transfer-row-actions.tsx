"use client";

import { useState } from "react";
import { toast } from "@/ui";
import CloseIcon from "@mui/icons-material/Close";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { Button, ConfirmationDialog, Menu, MenuItem } from "@/ui";
import type { StockTransferListItem } from "@/features/stock-transfers/types/stock-transfer";

type StockTransferRowActionsProps = {
  transfer: StockTransferListItem;
  onCancel: (id: string) => Promise<boolean>;
  isCancelling?: boolean;
};

export function StockTransferRowActions({
  transfer,
  onCancel,
  isCancelling = false,
}: StockTransferRowActionsProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const menuOpen = Boolean(anchorEl);
  const canCancel = transfer.status === "active";

  function closeMenu() {
    setAnchorEl(null);
  }

  return (
    <>
      <Button
        type="button"
        variant="text"
        aria-label={`Ações da transferência ${transfer.id}`}
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
        onClose={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          onClick={() => {
            closeMenu();
            toast.message("Visualização em breve", {
              description:
                "O detalhe da transferência será implementado em seguida.",
            });
          }}
        >
          <ListItemIcon>
            <VisibilityOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Visualizar</ListItemText>
        </MenuItem>
        {canCancel ? (
          <>
            <Divider />
            <MenuItem
              onClick={() => {
                closeMenu();
                setConfirmOpen(true);
              }}
              sx={{ color: "error.main" }}
            >
              <ListItemIcon sx={{ color: "inherit" }}>
                <CloseIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Cancelar</ListItemText>
            </MenuItem>
          </>
        ) : null}
      </Menu>

      <ConfirmationDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        title="Cancelar transferência?"
        description={`A transferência "${transfer.id}" será movida para Canceladas. Esta ação não pode ser desfeita.`}
        confirmLabel="Cancelar transferência"
        cancelLabel="Manter ativa"
        confirmColor="error"
        loading={isCancelling}
        onConfirm={async () => {
          const ok = await onCancel(transfer.id);
          if (ok) setConfirmOpen(false);
        }}
      />
    </>
  );
}
