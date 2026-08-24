"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import ReceiptOutlinedIcon from "@mui/icons-material/ReceiptOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { Button, Menu, MenuItem } from "@citybox/mui";
import type { BankAccountListItem } from "@/features/bank-accounts/types/bank-account";

type BankAccountRowActionsProps = {
  account: BankAccountListItem;
};

export function BankAccountRowActions({ account }: BankAccountRowActionsProps) {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);
  const basePath = `/financas/contas-bancarias/${account.id}`;

  function closeMenu() {
    setAnchorEl(null);
  }

  return (
    <>
      <Button
        type="button"
        variant="text"
        aria-label={`Ações de ${account.name}`}
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
            router.push(basePath);
          }}
        >
          <ListItemIcon>
            <ReceiptOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Transações</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeMenu();
            router.push(`${basePath}?view=historico`);
          }}
        >
          <ListItemIcon>
            <AccessTimeOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Histórico (extrato)</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            closeMenu();
            router.push(
              `/financas/conciliacao-bancaria?bankAccountId=${account.id}`,
            );
          }}
        >
          <ListItemIcon>
            <UploadFileOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Importar extrato (OFX)</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
