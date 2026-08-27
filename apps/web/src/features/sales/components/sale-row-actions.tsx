"use client";

import { useState } from "react";
import Link from "next/link";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import ReceiptOutlinedIcon from "@mui/icons-material/ReceiptOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { Button, Menu, MenuItem, toast } from "@/ui";
import {
  buildSaleOrderPdf,
  buildSaleOrderPdfFileName,
  downloadSaleOrderPdf,
  printSaleOrderPdf,
} from "@/features/sales-orders/lib/build-sale-order-pdf";
import { isSaleOrderReadOnly } from "@/features/sales-orders/lib/sale-order-read-only";
import type { SaleOrder } from "@/features/sales-orders/types/sale-order";

type SaleRowActionsProps = {
  sale: SaleOrder;
  onDelete: (id: string) => boolean;
};

export function SaleRowActions({ sale, onDelete }: SaleRowActionsProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [printAnchor, setPrintAnchor] = useState<null | HTMLElement>(null);
  const [pdfAnchor, setPdfAnchor] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);
  const readOnly = isSaleOrderReadOnly(sale);
  const canEdit = !readOnly;
  const canView = readOnly;

  function closeMenu() {
    setAnchorEl(null);
    setPrintAnchor(null);
    setPdfAnchor(null);
  }

  return (
    <>
      <Button
        type="button"
        variant="text"
        aria-label={`Ações da venda #${sale.number}`}
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
        slotProps={{ paper: { sx: { minWidth: 224 } } }}
      >
        <MenuItem
          onClick={() => {
            closeMenu();
            void printSaleOrderPdf(sale, { includeValues: true }).catch(() => {
              toast.error("Não foi possível abrir o recibo.");
            });
          }}
        >
          <ListItemIcon>
            <ReceiptOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ver recibo</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={(event) => setPrintAnchor(event.currentTarget)}
          aria-haspopup="menu"
        >
          <ListItemIcon>
            <PrintOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Imprimir pedido</ListItemText>
          <ChevronRightIcon sx={{ fontSize: 16, color: "text.secondary" }} />
        </MenuItem>

        <MenuItem
          onClick={(event) => setPdfAnchor(event.currentTarget)}
          aria-haspopup="menu"
        >
          <ListItemIcon>
            <FileDownloadOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Baixar PDF</ListItemText>
          <ChevronRightIcon sx={{ fontSize: 16, color: "text.secondary" }} />
        </MenuItem>

        <MenuItem
          component={Link}
          href="/financas/lancamentos"
          onClick={closeMenu}
        >
          <ListItemIcon>
            <PaymentsOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Recebimento financeiro</ListItemText>
        </MenuItem>

        <Divider />

        {canEdit ? (
          <MenuItem
            component={Link}
            href={`/vendas/${sale.id}`}
            onClick={closeMenu}
          >
            <ListItemIcon>
              <EditOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Editar</ListItemText>
          </MenuItem>
        ) : null}
        {canView ? (
          <MenuItem
            component={Link}
            href={`/vendas/${sale.id}`}
            onClick={closeMenu}
          >
            <ListItemIcon>
              <VisibilityOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Visualizar</ListItemText>
          </MenuItem>
        ) : null}
        <MenuItem
          onClick={() => {
            closeMenu();
            const ok = onDelete(sale.id);
            if (ok) {
              toast.success("Venda excluída", {
                description: `Venda #${sale.number} movida para Excluídos.`,
              });
            }
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon sx={{ color: "error.main" }}>
            <DeleteOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Excluir</ListItemText>
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={printAnchor}
        open={Boolean(printAnchor)}
        onClose={() => setPrintAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { sx: { minWidth: 208 } } }}
      >
        <MenuItem
          onClick={() => {
            closeMenu();
            void printSaleOrderPdf(sale, { includeValues: false }).catch(() => {
              toast.error("Não foi possível imprimir.");
            });
          }}
        >
          <ListItemText>Imprimir pedido sem valor</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeMenu();
            void printSaleOrderPdf(sale, { includeValues: true }).catch(() => {
              toast.error("Não foi possível imprimir.");
            });
          }}
        >
          <ListItemText>Imprimir pedido com valor</ListItemText>
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={pdfAnchor}
        open={Boolean(pdfAnchor)}
        onClose={() => setPdfAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { sx: { minWidth: 208 } } }}
      >
        <MenuItem
          onClick={() => {
            closeMenu();
            void buildSaleOrderPdf(sale, { includeValues: false })
              .then((blob) =>
                downloadSaleOrderPdf(blob, buildSaleOrderPdfFileName(sale)),
              )
              .catch(() => {
                toast.error("Não foi possível baixar o PDF.");
              });
          }}
        >
          <ListItemText>Baixar PDF sem valor</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeMenu();
            void buildSaleOrderPdf(sale, { includeValues: true })
              .then((blob) =>
                downloadSaleOrderPdf(blob, buildSaleOrderPdfFileName(sale)),
              )
              .catch(() => {
                toast.error("Não foi possível baixar o PDF.");
              });
          }}
        >
          <ListItemText>Baixar PDF com valor</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
