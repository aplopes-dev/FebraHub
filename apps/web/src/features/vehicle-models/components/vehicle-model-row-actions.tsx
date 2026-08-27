"use client";

import { useState } from "react";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { Button, ConfirmationDialog, Menu, MenuItem } from "@/ui";
import type { VehicleModelRow } from "@/features/vehicle-models/hooks/use-vehicle-model-list";

type VehicleModelRowActionsProps = {
  row: VehicleModelRow;
  onEdit: (row: VehicleModelRow) => void;
  onActivate: (row: VehicleModelRow) => void;
  onDeactivate: (row: VehicleModelRow) => void;
};

export function VehicleModelRowActions({
  row,
  onEdit,
  onActivate,
  onDeactivate,
}: VehicleModelRowActionsProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"activate" | "deactivate" | null>(
    null,
  );
  const menuOpen = Boolean(anchorEl);
  const isActive = row.status === "ACTIVE";

  function closeMenu() {
    setAnchorEl(null);
  }

  function handleConfirmStatusChange() {
    if (pendingAction === "activate") {
      onActivate(row);
    } else if (pendingAction === "deactivate") {
      onDeactivate(row);
    }
    setConfirmOpen(false);
    setPendingAction(null);
  }

  return (
    <>
      <Button
        type="button"
        variant="text"
        aria-label={`Ações de ${row.label}`}
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
            onEdit(row);
          }}
        >
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        <Divider />
        {isActive ? (
          <MenuItem
            onClick={() => {
              closeMenu();
              setPendingAction("deactivate");
              setConfirmOpen(true);
            }}
          >
            <ListItemIcon>
              <BlockOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Desativar</ListItemText>
          </MenuItem>
        ) : (
          <MenuItem
            onClick={() => {
              closeMenu();
              setPendingAction("activate");
              setConfirmOpen(true);
            }}
          >
            <ListItemIcon>
              <CheckCircleOutlineOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Ativar</ListItemText>
          </MenuItem>
        )}
      </Menu>

      <ConfirmationDialog
        open={confirmOpen}
        onCancel={() => {
          setConfirmOpen(false);
          setPendingAction(null);
        }}
        title={
          pendingAction === "activate" ? "Ativar modelo" : "Desativar modelo"
        }
        description={
          pendingAction === "activate"
            ? `Ativar ${row.label}?`
            : `Desativar ${row.label}? Modelos inativos não aparecem em novos cadastros de veículo.`
        }
        confirmLabel={
          pendingAction === "activate" ? "Ativar" : "Desativar"
        }
        cancelLabel="Cancelar"
        onConfirm={handleConfirmStatusChange}
      />
    </>
  );
}
