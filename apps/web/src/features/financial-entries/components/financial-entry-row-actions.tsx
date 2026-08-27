"use client";

import { useState } from "react";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import RestoreOutlinedIcon from "@mui/icons-material/RestoreOutlined";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { Button, ConfirmationDialog, Menu, MenuItem } from "@/ui";
import type { FinancialEntry } from "@/features/financial-entries/types/financial-entry";

type FinancialEntryRowActionsProps = {
  entry: FinancialEntry;
  onEdit: (entry: FinancialEntry) => void;
  onDelete: (entry: FinancialEntry) => void | Promise<void>;
  isDeleting?: boolean;
  /** Presente = linha está na aba Excluídos — troca Excluir por Restaurar. */
  onRestore?: (entry: FinancialEntry) => void | Promise<void>;
  isRestoring?: boolean;
};

export function FinancialEntryRowActions({
  entry,
  onEdit,
  onDelete,
  isDeleting,
  onRestore,
  isRestoring,
}: FinancialEntryRowActionsProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const menuOpen = Boolean(anchorEl);
  const isDeletedRow = Boolean(onRestore);

  function closeMenu() {
    setAnchorEl(null);
  }

  return (
    <>
      <Button
        type="button"
        variant="text"
        aria-label={`Ações de ${entry.description}`}
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
        {isDeletedRow ? (
          <MenuItem
            disabled={isRestoring}
            onClick={() => {
              closeMenu();
              void onRestore?.(entry);
            }}
          >
            <ListItemIcon>
              <RestoreOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Restaurar</ListItemText>
          </MenuItem>
        ) : (
          <>
            <MenuItem
              onClick={() => {
                closeMenu();
                onEdit(entry);
              }}
            >
              <ListItemIcon>
                <EditOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Editar</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={() => {
                closeMenu();
                setConfirmOpen(true);
              }}
              sx={{ color: "error.main" }}
            >
              <ListItemIcon sx={{ color: "error.main" }}>
                <DeleteOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Excluir</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>

      <ConfirmationDialog
        open={confirmOpen}
        title="Excluir lançamento"
        description={`Tem certeza que deseja excluir o lançamento "${entry.description}"? Você pode restaurá-lo depois na aba Excluídos.`}
        confirmLabel="Excluir"
        confirmColor="error"
        loading={isDeleting}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          await onDelete(entry);
          setConfirmOpen(false);
        }}
      />
    </>
  );
}
