"use client";

import { useState } from "react";
import Link from "next/link";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import { Button, Menu, toast } from "@citybox/mui";
import type { TechnicalSheetListItem } from "@/features/technical-sheets/types/technical-sheet";

type TechnicalSheetRowActionsProps = { sheet: TechnicalSheetListItem };

function notify(label: string, sheet: TechnicalSheetListItem) {
  toast.message(label, { description: `${sheet.name} — em breve.` });
}

export function TechnicalSheetRowActions({
  sheet,
}: TechnicalSheetRowActionsProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <>
      <Button
        type="button"
        variant="text"
        onClick={(event) => setAnchorEl(event.currentTarget)}
        aria-label={`Ações de ${sheet.name}`}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchorEl)}
        sx={{ minWidth: 32, px: 0.5 }}
      >
        <MoreHorizIcon sx={{ fontSize: 16 }} />
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          component={Link}
          href={`/catalogo/fichas-tecnicas/${sheet.id}`}
          onClick={() => setAnchorEl(null)}
        >
          <ListItemIcon>
            <AssignmentOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar ficha técnica</ListItemText>
        </MenuItem>
        <MenuItem
          component={Link}
          href={`/catalogo/produtos/${sheet.id}`}
          onClick={() => setAnchorEl(null)}
        >
          <ListItemIcon>
            <Inventory2OutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ver produto</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            notify("Duplicar ficha", sheet);
            setAnchorEl(null);
          }}
        >
          <ListItemIcon>
            <ContentCopyOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Duplicar ficha</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
