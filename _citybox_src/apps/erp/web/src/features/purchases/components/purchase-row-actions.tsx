"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import RestoreIcon from "@mui/icons-material/Restore";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { toast } from "@citybox/mui";
import { Button, ConfirmationDialog, Menu, MenuItem } from "@citybox/mui";
import { getPurchaseByIdApi } from "@/features/purchases/api/purchases.service";
import {
  buildPurchasePdf,
  buildPurchasePdfFileName,
  downloadPurchasePdf,
  printPurchasePdf,
} from "@/features/purchases/lib/build-purchase-pdf";
import type { PurchaseListItem } from "@/features/purchases/types/purchase";

type PurchaseRowActionsProps = {
  purchase: PurchaseListItem;
  onDelete: (id: string) => Promise<boolean>;
  onRestore: (id: string) => Promise<boolean>;
  isDeleting?: boolean;
  isRestoring?: boolean;
};

export function PurchaseRowActions({
  purchase,
  onDelete,
  onRestore,
  isDeleting = false,
  isRestoring = false,
}: PurchaseRowActionsProps) {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const menuOpen = Boolean(anchorEl);
  const isDeleted = purchase.deletedAt != null;
  const canEdit = !isDeleted && purchase.stockMovementId == null;
  const canView = !isDeleted && purchase.stockMovementId != null;
  const canDelete = !isDeleted;
  const canRestore = isDeleted;

  function closeMenu() {
    setAnchorEl(null);
  }

  async function handleDownloadPdf() {
    if (busy) return;
    setBusy(true);
    try {
      const detail = await getPurchaseByIdApi(purchase.id);
      const blob = await buildPurchasePdf(detail);
      downloadPurchasePdf(blob, buildPurchasePdfFileName(detail));
      toast.success("PDF baixado.");
    } catch {
      toast.error("Não foi possível gerar o PDF.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePrint() {
    if (busy) return;
    setBusy(true);
    try {
      const detail = await getPurchaseByIdApi(purchase.id);
      const blob = await buildPurchasePdf(detail);
      printPurchasePdf(blob);
    } catch (error) {
      const blocked =
        error instanceof Error && error.message === "POPUP_BLOCKED";
      toast.error(
        blocked
          ? "Permita pop-ups neste site para imprimir."
          : "Não foi possível preparar a impressão.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="text"
        aria-label={`Ações da compra ${purchase.id}`}
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
        {canRestore ? (
          <MenuItem
            disabled={isRestoring}
            onClick={() => {
              closeMenu();
              void onRestore(purchase.id);
            }}
          >
            <ListItemIcon>
              <RestoreIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Restaurar</ListItemText>
          </MenuItem>
        ) : null}
        {!isDeleted ? (
          <>
            <MenuItem
              disabled={busy}
              onClick={() => {
                closeMenu();
                window.setTimeout(() => void handleDownloadPdf(), 150);
              }}
            >
              <ListItemIcon>
                <DownloadOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Baixar PDF da compra</ListItemText>
            </MenuItem>
            <MenuItem
              disabled={busy}
              onClick={() => {
                closeMenu();
                window.setTimeout(() => void handlePrint(), 150);
              }}
            >
              <ListItemIcon>
                <PrintOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Imprimir</ListItemText>
            </MenuItem>
            {canEdit ? (
              <MenuItem
                onClick={() => {
                  closeMenu();
                  router.push(`/estoque/compras/${purchase.id}`);
                }}
              >
                <ListItemIcon>
                  <EditOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Editar</ListItemText>
              </MenuItem>
            ) : null}
            {canView ? (
              <MenuItem
                onClick={() => {
                  closeMenu();
                  router.push(`/estoque/compras/${purchase.id}`);
                }}
              >
                <ListItemIcon>
                  <VisibilityOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Visualizar</ListItemText>
              </MenuItem>
            ) : null}
            {canDelete ? (
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
                    <DeleteOutlinedIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Excluir</ListItemText>
                </MenuItem>
              </>
            ) : null}
          </>
        ) : null}
      </Menu>

      <ConfirmationDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        title="Excluir compra?"
        description="A compra será movida para Excluídas. Você poderá restaurá-la depois pela aba Excluídas."
        confirmLabel="Excluir"
        cancelLabel="Manter ativa"
        confirmColor="error"
        loading={isDeleting}
        onConfirm={async () => {
          const ok = await onDelete(purchase.id);
          if (ok) setConfirmOpen(false);
        }}
      />
    </>
  );
}
