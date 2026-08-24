"use client";

import { useId, useState, type ReactNode } from "react";
import Link from "next/link";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import {
  Button,
  ConfirmationDialog,
  Menu,
  MenuItem,
} from "@citybox/mui";

export type RowActionItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  /**
   * Navegação via `<Link>` (dispara nextjs-toploader). Preferir a `onClick`
   * + `router.push` quando o destino for uma rota do app.
   */
  href?: string;
  onClick?: () => void;
  /** Destaca como ação destrutiva (vermelho). */
  destructive?: boolean;
  dividerBefore?: boolean;
  disabled?: boolean;
  /** Exibido abaixo do item quando desabilitado. */
  disabledCaption?: string;
};

export type RowActionsMenuProps = {
  ariaLabel: string;
  items: RowActionItem[];
  confirmDelete?: {
    title: ReactNode;
    description?: ReactNode;
    confirmLabel?: string;
    /** Pode ser async — o modal só fecha após resolver. */
    onConfirm: () => void | Promise<void>;
  };
};

/**
 * Menu ⋯ padrão das listagens MUI + ConfirmationDialog opcional para exclusão.
 * Passe `confirmDelete` e use `id: "delete"` no item — o clique abre o dialog.
 * Itens com `href` usam `next/link` (top loader); demais usam `onClick`.
 */
export function RowActionsMenu({
  ariaLabel,
  items,
  confirmDelete,
}: RowActionsMenuProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const menuOpen = Boolean(anchorEl);
  const menuId = useId();

  function closeMenu() {
    setAnchorEl(null);
  }

  async function handleConfirmDelete() {
    if (!confirmDelete || confirmLoading) return;
    setConfirmLoading(true);
    try {
      await confirmDelete.onConfirm();
      setConfirmOpen(false);
    } finally {
      setConfirmLoading(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="text"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-controls={menuOpen ? menuId : undefined}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{ minWidth: 32, px: 0.5 }}
      >
        <MoreHorizIcon sx={{ fontSize: 16 }} />
      </Button>

      <Menu
        id={menuId}
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {items.flatMap((item) => {
          const isLink = Boolean(item.href) && !item.disabled;
          // Divider e MenuItem precisam ser filhos DIRETOS do Menu (MUI usa
          // React.Children para navegação por teclado); nada de <span> em volta.
          const menuItem = (
            <MenuItem
              key={item.id}
              disabled={item.disabled}
              {...(isLink
                ? {
                    component: Link,
                    href: item.href!,
                    onClick: () => {
                      closeMenu();
                      item.onClick?.();
                    },
                  }
                : {
                    onClick: () => {
                      if (item.disabled) return;
                      closeMenu();
                      if (item.id === "delete" && confirmDelete) {
                        setConfirmOpen(true);
                        return;
                      }
                      item.onClick?.();
                    },
                  })}
              sx={item.destructive ? { color: "error.main" } : undefined}
            >
              {item.icon ? (
                <ListItemIcon
                  sx={item.destructive ? { color: "inherit" } : undefined}
                >
                  {item.icon}
                </ListItemIcon>
              ) : null}
              <ListItemText
                primary={item.label}
                secondary={item.disabled ? item.disabledCaption : undefined}
                slotProps={{ secondary: { variant: "caption" } }}
              />
            </MenuItem>
          );
          return item.dividerBefore
            ? [<Divider key={`${item.id}-divider`} />, menuItem]
            : [menuItem];
        })}
      </Menu>

      {confirmDelete ? (
        <ConfirmationDialog
          open={confirmOpen}
          onCancel={() => {
            if (!confirmLoading) setConfirmOpen(false);
          }}
          title={confirmDelete.title}
          description={confirmDelete.description}
          confirmLabel={confirmDelete.confirmLabel ?? "Excluir"}
          cancelLabel="Cancelar"
          confirmColor="error"
          loading={confirmLoading}
          onConfirm={handleConfirmDelete}
        />
      ) : null}
    </>
  );
}
