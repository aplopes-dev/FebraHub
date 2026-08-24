"use client";

import CreditCardOutlined from "@mui/icons-material/CreditCardOutlined";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import ReceiptOutlined from "@mui/icons-material/ReceiptOutlined";
import ScheduleOutlined from "@mui/icons-material/ScheduleOutlined";
import WarehouseOutlined from "@mui/icons-material/WarehouseOutlined";
import BoltOutlined from "@mui/icons-material/BoltOutlined";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import LinearProgress from "@mui/material/LinearProgress";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { Button, Typography } from "@citybox/mui";
import type { PlanInfo } from "../types/company";

type PlanDetailsModalProps = {
  open: boolean;
  onClose: () => void;
  plan: PlanInfo;
};

export function PlanDetailsModal({ open, onClose, plan }: PlanDetailsModalProps) {
  const usersPercent = Math.round((plan.usersUsed / plan.usersLimit) * 100);
  const nfePercent = Math.round((plan.nfeUsed / plan.nfeLimit) * 100);
  const diskPercent = Math.round((plan.diskUsedGb / plan.diskLimitGb) * 100);

  const formattedExpiration = new Date(plan.expiresAt).toLocaleDateString("pt-BR");
  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(plan.price);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1, display: "flex", alignItems: "center", gap: 1 }}>
        <CreditCardOutlined sx={{ fontSize: 24, color: "primary.main" }} />
        <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
          Detalhes do Meu Plano
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 3 }}>
        <Stack spacing={3}>
          <Box
            sx={{
              p: 2.5,
              borderRadius: 1,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              backgroundImage:
                "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0))",
              position: "relative",
              overflow: "hidden",
              boxShadow: 2,
            }}
          >
            <Stack
              direction="row"
              sx={{ justifyContent: "space-between", alignItems: "center" }}
            >
              <Box>
                <Typography
                  variant="overline"
                  sx={{ opacity: 0.8, letterSpacing: 1.2, display: "block" }}
                >
                  Plano Atual
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {plan.name}
                </Typography>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {formattedPrice}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8, display: "block" }}>
                  por mês
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction="row"
              spacing={1}
              sx={{
                mt: 3,
                pt: 2,
                borderTop: "1px solid rgba(255,255,255,0.15)",
                alignItems: "center",
              }}
            >
              <ScheduleOutlined sx={{ fontSize: 16 }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Próxima renovação: {formattedExpiration}
              </Typography>
              <Box
                sx={{
                  ml: "auto",
                  px: 1.25,
                  py: 0.25,
                  borderRadius: 10,
                  bgcolor: "rgba(255, 255, 255, 0.2)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                Ativo
              </Box>
            </Stack>
          </Box>

          <Stack spacing={2.5}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, color: "text.secondary", letterSpacing: 0.5 }}
            >
              UTILIZAÇÃO DO LIMITE
            </Typography>

            <Stack spacing={1}>
              <Stack
                direction="row"
                sx={{ justifyContent: "space-between", alignItems: "center" }}
              >
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <GroupsOutlined sx={{ fontSize: 18, color: "text.secondary" }} />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Usuários Ativos
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {plan.usersUsed} de {plan.usersLimit} ({usersPercent}%)
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={usersPercent}
                color={
                  usersPercent > 90 ? "error" : usersPercent > 75 ? "warning" : "primary"
                }
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Stack>

            <Stack spacing={1}>
              <Stack
                direction="row"
                sx={{ justifyContent: "space-between", alignItems: "center" }}
              >
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <ReceiptOutlined sx={{ fontSize: 18, color: "text.secondary" }} />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Notas Fiscais Emitidas (Mês)
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {plan.nfeUsed} de {plan.nfeLimit} ({nfePercent}%)
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={nfePercent}
                color={nfePercent > 90 ? "error" : nfePercent > 75 ? "warning" : "primary"}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Stack>

            <Stack spacing={1}>
              <Stack
                direction="row"
                sx={{ justifyContent: "space-between", alignItems: "center" }}
              >
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <WarehouseOutlined sx={{ fontSize: 18, color: "text.secondary" }} />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Espaço de Armazenamento
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {plan.diskUsedGb} GB de {plan.diskLimitGb} GB ({diskPercent}%)
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={diskPercent}
                color={diskPercent > 90 ? "error" : diskPercent > 75 ? "warning" : "primary"}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Stack>
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1.5 }}>
        <Button variant="outlined" color="primary" fullWidth onClick={onClose}>
          Fechar
        </Button>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          startIcon={<BoltOutlined sx={{ fontSize: 18 }} />}
        >
          Fazer Upgrade
        </Button>
      </DialogActions>
    </Dialog>
  );
}
