"use client";

import { useState } from "react";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import {
  Button,
  ConfirmationDialog,
  Menu,
  MenuItem,
  toast,
} from "@/ui";
import { downloadCouponCodes } from "@/features/promotions/lib/download-coupon-codes";
import type { Promotion } from "@/features/promotions/types/promotion";

/** Quantidade padrão de códigos gerados pela lista (mock — sem config real). */
const DEFAULT_COUPON_CODES = 50;

type PromotionRowActionsProps = {
  promotion: Promotion;
  onEdit: (promotion: Promotion) => void;
  onDelete: (promotion: Promotion) => void;
  onRestore: (promotion: Promotion) => void;
};

export function PromotionRowActions({
  promotion,
  onEdit,
  onDelete,
  onRestore,
}: PromotionRowActionsProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const menuOpen = Boolean(anchorEl);
  const isDeleted = promotion.deletedAt != null;
  const isCoupon = promotion.type === "discount_coupon";

  function closeMenu() {
    setAnchorEl(null);
  }

  function handleDownloadCoupons() {
    downloadCouponCodes({
      baseName: promotion.name,
      quantity: DEFAULT_COUPON_CODES,
      autoNumbering: true,
    });
    toast.success("Códigos do cupom gerados para download.");
  }

  return (
    <>
      <Button
        type="button"
        variant="text"
        aria-label={`Ações de ${promotion.name}`}
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
        {isDeleted ? (
          <MenuItem
            onClick={() => {
              closeMenu();
              onRestore(promotion);
            }}
          >
            <ListItemIcon>
              <RestartAltOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Restaurar</ListItemText>
          </MenuItem>
        ) : (
          <>
            {isCoupon ? (
              <>
                <MenuItem
                  onClick={() => {
                    closeMenu();
                    handleDownloadCoupons();
                  }}
                >
                  <ListItemIcon>
                    <DownloadOutlinedIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Baixar códigos do cupom</ListItemText>
                </MenuItem>
                <Divider />
              </>
            ) : null}
            <MenuItem
              onClick={() => {
                closeMenu();
                onEdit(promotion);
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
        title="Excluir promoção"
        description={`Tem certeza que deseja excluir “${promotion.name}”? Ela ficará disponível na aba Excluídas.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        confirmColor="error"
        onConfirm={() => {
          onDelete(promotion);
          setConfirmOpen(false);
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
