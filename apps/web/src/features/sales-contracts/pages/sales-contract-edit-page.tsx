"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { BackButton } from "@/components/ui/form";
import { SalesContractFormView } from "@/features/sales-contracts/components/sales-contract-form-view";
import { contractToFormValues } from "@/features/sales-contracts/lib/sales-contract-form-values";
import { getSalesContractById } from "@/features/sales-contracts/services/sales-contract.service";

type SalesContractEditPageProps = {
  contractId: string;
};

export function SalesContractEditPage({
  contractId,
}: SalesContractEditPageProps) {
  const contract = getSalesContractById(contractId);

  if (!contract || contract.deletedAt) {
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
        <BackButton href="/vendas/contratos-de-vendas" label="Voltar" />
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

  return (
    <SalesContractFormView
      contractId={contract.id}
      title={`Contrato #${contract.number}`}
      subtitle="Editar contrato"
      initialValues={contractToFormValues(contract)}
      formKey={`edit-${contract.id}`}
    />
  );
}
