"use client";

import { useState } from "react";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { Button, ConfirmationDialog, Menu, MenuItem } from "@citybox/mui";
import type { CustomerCategory } from "@/features/customer-categories/types/customer-category";

type CustomerCategoryRowActionsProps = {
  category: CustomerCategory;
  onEdit: (category: CustomerCategory) => void;
  onDelete: (category: CustomerCategory) => void;
};

export function CustomerCategoryRowActions({
  category,
  onEdit,
  onDelete,
}: CustomerCategoryRowActionsProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const menuOpen = Boolean(anchorEl);

  function closeMenu() {
    setAnchorEl(null);
  }

  function handleConfirmDelete() {
    onDelete(category);
    setConfirmOpen(false);
  }

  return (
    <>
      <Button
        type="button"
        variant="text"
        aria-label={`Ações de ${category.name}`}
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
            onEdit(category);
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
          <ListItemIcon sx={{ color: "inherit" }}>
            <DeleteOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Excluir</ListItemText>
        </MenuItem>
      </Menu>

      <ConfirmationDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        title="Excluir categoria?"
        description={
          <>
            Tem certeza que deseja excluir{" "}
            <span style={{ fontWeight: 600 }}>{category.name}</span>? Essa ação
            não pode ser desfeita.
          </>
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        confirmColor="error"
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
