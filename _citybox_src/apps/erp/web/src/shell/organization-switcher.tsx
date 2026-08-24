"use client";

import BusinessOutlined from "@mui/icons-material/BusinessOutlined";
import Check from "@mui/icons-material/Check";
import UnfoldMore from "@mui/icons-material/UnfoldMore";

import { useState } from "react";
import Box from "@mui/material/Box";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import {
  Button,
  Menu,
  MenuItem,
  Typography,
} from "@citybox/mui";
import { useOrganization } from "@/lib/organization-context";

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Responsável",
  ADMIN: "Administrador",
  MEMBER: "Operador",
};

export function OrganizationSwitcher() {
  const { organization, organizations, organizationId, setOrganization, loading } =
    useOrganization();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  function closeMenu() {
    setAnchorEl(null);
  }

  // Com uma empresa só não há o que trocar — o nome no header só ocupa espaço.
  if (!loading && organizations.length <= 1) {
    return null;
  }

  return (
    <>
      <Button
        type="button"
        variant="outlined"
        aria-label="Trocar de empresa"
        disabled={loading}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{
          height: 36,
          maxWidth: 16 * 16,
          flexShrink: 0,
          justifyContent: "space-between",
          gap: 1,
          px: 1.5,
        }}
      >
        <Box
          sx={{
            display: "flex",
            minWidth: 0,
            alignItems: "center",
            gap: 1,
          }}
        >
          <BusinessOutlined sx={{ fontSize: 16, color: "primary.main", flexShrink: 0 }} aria-hidden />
          <Typography variant="body2" noWrap>
            {organization?.displayName ?? "Selecionar empresa"}
          </Typography>
        </Box>
        <UnfoldMore sx={{ fontSize: 16, color: "text.secondary", flexShrink: 0 }} aria-hidden />
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { sx: { width: 288 } } }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2">Empresas</Typography>
        </Box>
        {organizations.map((item) => (
          <MenuItem
            key={item.id}
            onClick={() => {
              setOrganization(item.id);
              closeMenu();
            }}
            sx={{ gap: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 28 }}>
              <Check sx={{ fontSize: 16, opacity: item.id === organizationId ? 1 : 0 }} aria-hidden />
            </ListItemIcon>
            <ListItemText
              primary={item.displayName}
              secondary={`${ROLE_LABEL[item.role] ?? item.role} · ${
                item.branchCount === 1
                  ? "1 unidade"
                  : `${item.branchCount} unidades`
              }`}
              slotProps={{
                primary: { noWrap: true },
                secondary: { noWrap: true },
              }}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
