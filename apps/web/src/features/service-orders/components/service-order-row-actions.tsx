"use client";

import { useState } from "react";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
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
import { getServiceOrderStatusById } from "@/features/service-orders/services/service-order-status.service";
import type { ServiceOrder } from "@/features/service-orders/types/service-order";

type ServiceOrderRowActionsProps = {
  order: ServiceOrder;
  onEdit: (order: ServiceOrder) => void;
  onGenerateSale: (order: ServiceOrder) => void;
  onCancel: (order: ServiceOrder) => void;
};

export function ServiceOrderRowActions({
  order,
  onEdit,
  onGenerateSale,
  onCancel,
}: ServiceOrderRowActionsProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [printAnchor, setPrintAnchor] = useState<null | HTMLElement>(null);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const menuOpen = Boolean(anchorEl);
  const baseType = getServiceOrderStatusById(order.statusId)?.baseType;
  const isFinished = baseType === "closed" || baseType === "canceled";

  function closeMenu() {
    setAnchorEl(null);
    setPrintAnchor(null);
  }

  function notifyPrint(label: string) {
    toast.message(`${label} de ${order.code} em breve`);
  }

  return (
    <>
      <Button
        type="button"
        variant="text"
        aria-label={`Ações de ${order.code}`}
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
            onEdit(order);
          }}
        >
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {isFinished ? "Ver detalhes" : "Editar"}
          </ListItemText>
        </MenuItem>

        <MenuItem
          onClick={(event) => setPrintAnchor(event.currentTarget)}
          aria-haspopup="menu"
        >
          <ListItemIcon>
            <PrintOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Imprimir</ListItemText>
          <ChevronRightIcon sx={{ fontSize: 16, color: "text.secondary" }} />
        </MenuItem>

        {!isFinished ? (
          <>
            <MenuItem
              onClick={() => {
                closeMenu();
                onGenerateSale(order);
              }}
            >
              <ListItemIcon>
                <PaymentsOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Gerar venda</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={() => {
                closeMenu();
                setConfirmCancelOpen(true);
              }}
              sx={{ color: "error.main" }}
            >
              <ListItemIcon sx={{ color: "error.main" }}>
                <BlockOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Cancelar OS</ListItemText>
            </MenuItem>
          </>
        ) : null}
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
            notifyPrint("Impressão da OS");
          }}
        >
          <ListItemText>Ordem de serviço</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeMenu();
            notifyPrint("Termo de entrada");
          }}
        >
          <ListItemText>Termo de entrada</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeMenu();
            notifyPrint("Termo de retirada");
          }}
        >
          <ListItemText>Termo de retirada</ListItemText>
        </MenuItem>
      </Menu>

      <ConfirmationDialog
        open={confirmCancelOpen}
        title="Cancelar ordem de serviço"
        description={`Tem certeza que deseja cancelar a ${order.code} de ${order.customerName}? Ela vai para a aba Cancelada.`}
        confirmLabel="Cancelar OS"
        cancelLabel="Voltar"
        confirmColor="error"
        onConfirm={() => {
          onCancel(order);
          setConfirmCancelOpen(false);
        }}
        onCancel={() => setConfirmCancelOpen(false)}
      />
    </>
  );
}
