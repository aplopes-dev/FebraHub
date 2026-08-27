"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { BackButton } from "@/components/ui/form/back-button";
import { CardContractDetailView } from "@/features/card-contracts/components/card-contract-detail-view";
import { useCardContractQuery } from "@/features/card-contracts/hooks/use-card-contract-queries";

type CardContractEditPageProps = {
  contractId: string;
};

export function CardContractEditPage({ contractId }: CardContractEditPageProps) {
  const query = useCardContractQuery(contractId);

  if (query.isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          py: 8,
        }}
      >
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Box
        component="section"
        sx={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 2,
        }}
      >
        <BackButton
          href="/financas/contratos-de-cartoes-e-outros"
          label="Voltar"
        />
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            Contrato não encontrado
          </Typography>
          <Typography
            variant="body2"
            sx={{ mt: 0.5, color: "text.secondary" }}
          >
            Este contrato não existe ou foi excluído.
          </Typography>
        </Box>
      </Box>
    );
  }

  return <CardContractDetailView contract={query.data} />;
}
