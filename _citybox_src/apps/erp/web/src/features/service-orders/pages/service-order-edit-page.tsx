"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useParams } from "next/navigation";
import { BackButton } from "@/components/ui/form";
import { ServiceOrderFormView } from "@/features/service-orders/components/service-order-form/service-order-form-view";
import { useServiceOrderQuery } from "@/features/service-orders/hooks/use-service-order-queries";

function ServiceOrderNotFound() {
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

/**
 * Bugfix (2026-08-20, achado em teste manual pós spec erp/031): esta página
 * lia de `getServiceOrderById` — um store mock desconectado da API real
 * (`services/service-order.service.ts`), enquanto a listagem já usava
 * `/v1/service-orders` de verdade. Qualquer OS real clicada na grid batia
 * sempre em "Ordem de serviço não encontrada", porque o id real nunca
 * existia no mock. `useServiceOrderQuery` (React Query, já existente e usado
 * em outros pontos da feature) resolve pela API real.
 */
export function ServiceOrderEditPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : undefined;
  const { data: order, isLoading, isError } = useServiceOrderQuery(id);

  if (isLoading) {
    return (
      <Stack spacing={4}>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Carregando a ordem de serviço…
        </Typography>
      </Stack>
    );
  }

  if (isError || !order) {
    return <ServiceOrderNotFound />;
  }

  return <ServiceOrderFormView key={order.id} order={order} />;
}
