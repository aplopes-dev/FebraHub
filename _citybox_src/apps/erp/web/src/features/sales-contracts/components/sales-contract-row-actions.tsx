"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { Button, Menu, MenuItem, toast } from "@citybox/mui";
import type { SalesContract } from "@/features/sales-contracts/types/sales-contract";

type SalesContractRowActionsProps = {
  contract: SalesContract;
  onDelete: (id: string) => boolean;
  onRestore: (id: string) => boolean;
};

export function SalesContractRowActions({
  contract,
  onDelete,
  onRestore,
}: SalesContractRowActionsProps) {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);
  const isDeleted = Boolean(contract.deletedAt);

  function closeMenu() {
    setAnchorEl(null);
  }

  return (
    <>
      <Button
        type="button"
        variant="text"
        aria-label={`Ações do contrato #${contract.number}`}
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
        slotProps={{ paper: { sx: { minWidth: 176 } } }}
      >
        {!isDeleted ? (
          <>
            <MenuItem
              onClick={() => {
                closeMenu();
                router.push(`/vendas/contratos-de-vendas/${contract.id}`);
              }}
            >
              <ListItemIcon>
                <EditOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Editar</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => {
                closeMenu();
                if (onDelete(contract.id)) {
                  toast.success("Contrato movido para excluídos.");
                }
              }}
              sx={{ color: "error.main" }}
            >
              <ListItemIcon sx={{ color: "error.main" }}>
                <DeleteOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Excluir</ListItemText>
            </MenuItem>
          </>
        ) : (
          <MenuItem
            onClick={() => {
              closeMenu();
              if (onRestore(contract.id)) {
                toast.success("Contrato restaurado.");
              }
            }}
          >
            <ListItemIcon>
              <RestartAltOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Restaurar</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
}
