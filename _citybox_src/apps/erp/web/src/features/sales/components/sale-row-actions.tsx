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
import Tooltip from "@mui/material/Tooltip";
import { Button, Menu, MenuItem, toast } from "@citybox/mui";
import {
  buildSaleOrderPdf,
  buildSaleOrderPdfFileName,
  downloadSaleOrderPdf,
  printSaleOrderPdf,
} from "@/features/sales-orders/lib/build-sale-order-pdf";
import { isSaleOrderReadOnly } from "@/features/sales-orders/lib/sale-order-read-only";
import type { SaleOrder } from "@/features/sales-orders/types/sale-order";
import { downloadFiscalDocument } from "@/lib/api/fiscal-client";

type SaleRowActionsProps = {
  sale: SaleOrder;
  onDelete: (id: string) => boolean;
};

export function SaleRowActions({ sale, onDelete }: SaleRowActionsProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [printAnchor, setPrintAnchor] = useState<null | HTMLElement>(null);
  const [pdfAnchor, setPdfAnchor] = useState<null | HTMLElement>(null);
  const [downloadingNfe, setDownloadingNfe] = useState<"xml" | "danfe" | null>(
    null,
  );
  const menuOpen = Boolean(anchorEl);
  const readOnly = isSaleOrderReadOnly(sale);
  const canEdit = !readOnly;
  const canView = readOnly;

  function closeMenu() {
    setAnchorEl(null);
    setPrintAnchor(null);
    setPdfAnchor(null);
  }

  // spec erp/029 (B3): XML/PDF só existem para nota AUTORIZADA.
  const nfeDocumentId = sale.nfeIssuance?.fiscalDocumentId ?? null;
  const nfeAuthorized = sale.nfeIssuance?.status === "AUTHORIZED";
  const canDownloadNfe = nfeAuthorized && Boolean(nfeDocumentId);
  const nfeDownloadDisabledReason = !sale.nfeIssuance
    ? "Esta venda ainda não tem NF-e emitida."
    : !nfeAuthorized
      ? "Só é possível baixar XML/DANFE de uma NF-e autorizada pelo órgão."
      : null;

  async function handleDownloadNfe(kind: "xml" | "danfe") {
    if (!nfeDocumentId) return;
    setDownloadingNfe(kind);
    try {
      const filename =
        kind === "xml" ? `NFe-${sale.number}.xml` : `DANFE-${sale.number}.pdf`;
      await downloadFiscalDocument(`/v1/nfe/${nfeDocumentId}/${kind}`, filename);
    } catch {
      toast.error(
        kind === "xml"
          ? "Não foi possível baixar o XML da NF-e."
          : "Não foi possível baixar o DANFE.",
      );
    } finally {
      // Fecha só ao terminar (não no clique) — achado do react-review (spec
      // erp/029): fechar antes desmontava o `MenuItem` no mesmo tick, e o
      // rótulo "Baixando…"/o disabled do item irmão nunca chegavam a
      // renderizar.
      setDownloadingNfe(null);
      closeMenu();
    }
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

        <Tooltip
          title={nfeDownloadDisabledReason ?? ""}
          placement="left"
          disableHoverListener={!nfeDownloadDisabledReason}
        >
          <span>
            <MenuItem
              disabled={!canDownloadNfe || downloadingNfe !== null}
              onClick={() => void handleDownloadNfe("xml")}
            >
              <ListItemIcon>
                <FileDownloadOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>
                {downloadingNfe === "xml" ? "Baixando XML…" : "Baixar XML (NF-e)"}
              </ListItemText>
            </MenuItem>
          </span>
        </Tooltip>
        <Tooltip
          title={nfeDownloadDisabledReason ?? ""}
          placement="left"
          disableHoverListener={!nfeDownloadDisabledReason}
        >
          <span>
            <MenuItem
              disabled={!canDownloadNfe || downloadingNfe !== null}
              onClick={() => void handleDownloadNfe("danfe")}
            >
              <ListItemIcon>
                <FileDownloadOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>
                {downloadingNfe === "danfe" ? "Baixando DANFE…" : "Baixar DANFE"}
              </ListItemText>
            </MenuItem>
          </span>
        </Tooltip>

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
