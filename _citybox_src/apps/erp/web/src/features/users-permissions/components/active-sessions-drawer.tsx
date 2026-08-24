"use client";

import LogoutIcon from "@mui/icons-material/Logout";
import Typography from "@mui/material/Typography";
import { Button, Drawer, EmptyState } from "@citybox/mui";

type ActiveSessionsDrawerProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * Sessões ativas — sem backend nesta fatia. Drawer com empty state "Em breve".
 */
export function ActiveSessionsDrawer({
  open,
  onClose,
}: ActiveSessionsDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Sessões ativas"
      width={720}
      footer={
        <Button
          type="button"
          variant="outlined"
          color="error"
          fullWidth
          startIcon={<LogoutIcon fontSize="small" />}
          disabled
        >
          Revogar todas as sessões
        </Button>
      }
    >
      <EmptyState
        icon={<LogoutIcon sx={{ fontSize: 24 }} />}
        title="Em breve"
        description="O gerenciamento de sessões ativas ainda não está disponível. Em uma próxima versão você poderá ver e revogar logins da equipe."
      />
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
        Nenhuma ação disponível por enquanto.
      </Typography>
    </Drawer>
  );
}
