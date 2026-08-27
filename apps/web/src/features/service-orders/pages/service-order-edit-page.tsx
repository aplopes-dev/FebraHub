"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useParams } from "next/navigation";
import { BackButton } from "@/components/ui/form";
import { ServiceOrderFormView } from "@/features/service-orders/components/service-order-form/service-order-form-view";
import { getServiceOrderById } from "@/features/service-orders/services/service-order.service";

export function ServiceOrderEditPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const order = getServiceOrderById(id);

  if (!order) {
    return (
      <Box
        sx={{
          display: "flex",
          height: "100%",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          textAlign: "center",
        }}
      >
        <Stack spacing={0.5}>
          <Typography variant="h6" component="h1" sx={{ fontWeight: 600 }}>
            Ordem de serviço não encontrada
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            A OS que você tentou abrir não existe mais ou foi removida.
          </Typography>
        </Stack>
        <BackButton
          href="/vendas/ordem-de-servicos"
          label="Voltar para Ordens de serviço"
        />
      </Box>
    );
  }

  return <ServiceOrderFormView key={order.id} order={order} />;
}
