"use client";

import EditOutlined from "@mui/icons-material/EditOutlined";
import { Page } from "@/components/ui/page";

import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import { Button } from "@/ui";
import { EntityFormHeader } from "@/components/ui/form";
import { PaymentMethodsSection } from "@/features/card-contracts/components/payment-methods-section";
import { CardContractEditDialog } from "@/features/card-contracts/components/card-contract-edit-dialog";
import {
  GROUPING_LABELS,
  CUTOFF_PERIOD_LABELS,
  FIRST_PAYMENT_DAY_LABELS,
  INSTALLMENT_DAY_LABELS,
  type CardContract,
  type CardContractFormValues,
} from "@/features/card-contracts/types/card-contract";
import { useBankAccountOptionsQuery } from "@/features/bank-accounts/hooks/use-bank-account-options-query";
import { useCardContractDetail } from "@/features/card-contracts/hooks/use-card-contract-detail";

type CardContractDetailViewProps = {
  contract: CardContract;
};

export function CardContractDetailView({
  contract,
}: CardContractDetailViewProps) {
  const {
    methods,
    addMethod,
    updateMethod,
    removeMethod,
    updateContract,
    isUpdatingContract,
    isSavingMethod,
  } = useCardContractDetail(contract);
  const bankAccountsQuery = useBankAccountOptionsQuery();
  const bankAccountName =
    bankAccountsQuery.data?.find(
      (account) => account.id === contract.bankAccountId,
    )?.name ?? "—";

  const [editOpen, setEditOpen] = useState(false);
  const [editFormNonce, setEditFormNonce] = useState(0);
  const editFormKey = `edit-${contract.id}-${editFormNonce}`;

  function handleOpenEdit() {
    setEditFormNonce((nonce) => nonce + 1);
    setEditOpen(true);
  }

  function handleEditSave(values: CardContractFormValues) {
    updateContract(values, () => setEditOpen(false));
  }

  return (
    <>
      <Page>
        <Stack
          spacing={5}
          sx={{ minWidth: 0, maxWidth: "100%" }}
        >
          <EntityFormHeader
            title={`Contrato — ${contract.provider}`}
            subtitle="Contratos de cartões"
            backHref="/financas/contratos-de-cartoes-e-outros"
          />

          <Box
            sx={{
              display: "grid",
              gap: { xs: 3, lg: 5 },
              gridTemplateColumns: { lg: "minmax(16rem, 22rem) minmax(0, 1fr)" },
              alignItems: "start",
              minWidth: 0,
              width: "100%",
            }}
          >
            <Box
              component="header"
              sx={{
                pt: { lg: 0.5 },
                "& h2": { m: 0, fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.01em" },
                "& p": { m: 0, mt: 0.5, fontSize: "0.875rem", color: "text.secondary" },
              }}
            >
              <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 600 }}>
                Informações básicas
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Dados cadastrais do contrato com a adquirente.
              </Typography>
            </Box>

            <Box
              sx={{
                borderRadius: 1,
                border: 1,
                borderColor: "divider",
                bgcolor: "background.paper",
                p: 2.5,
                minWidth: 0,
              }}
            >
              <Stack spacing={2}>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                    <DetailField label="Provedor" value={contract.provider} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                    <DetailField label="Conta para crédito" value={bankAccountName} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                    <DetailField
                      label="Agrupamento"
                      value={GROUPING_LABELS[contract.grouping]}
                    />
                  </Grid>
                  {contract.description && (
                    <Grid size={12}>
                      <DetailField label="Descrição" value={contract.description} />
                    </Grid>
                  )}
                </Grid>

                <Divider />

                <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                  Prazos de pagamento
                </Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                    <DetailField
                      label="Primeiro pagamento"
                      value={FIRST_PAYMENT_DAY_LABELS[contract.firstPaymentDayType]}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                    <DetailField
                      label="Dia das parcelas"
                      value={INSTALLMENT_DAY_LABELS[contract.installmentDayType]}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                    <DetailField
                      label="Período de corte"
                      value={CUTOFF_PERIOD_LABELS[contract.cutoffPeriod]}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                    <DetailField
                      label="Vencimento dias úteis"
                      value={contract.businessDaysOnly ? "Sim" : "Não"}
                    />
                  </Grid>
                </Grid>

                <Divider />

                <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                  Taxas e antecipações
                </Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                    <DetailField
                      label="Tarifa para depósito"
                      value={contract.depositFeeCents > 0 ? `R$ ${(contract.depositFeeCents / 100).toFixed(2).replace(".", ",")}` : "Grátis"}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                    <DetailField
                      label="Taxa de antecipação"
                      value={contract.anticipationRate > 0 ? `${contract.anticipationRate.toFixed(1).replace(".", ",")}%` : "—"}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                    <DetailField
                      label="Períodos de antecipação"
                      value={contract.anticipationPeriods > 0 ? `${contract.anticipationPeriods} dias` : "—"}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                    <DetailField
                      label="Entradas pagas neste contrato"
                      value={contract.allEntriesPaidInContract ? "Sim" : "Não"}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                    <DetailField
                      label="Depósito apenas dias úteis"
                      value={contract.businessDaysDeposit ? "Sim" : "Não"}
                    />
                  </Grid>
                </Grid>

                <Box>
                  <Button
                    type="button"
                    variant="outlined"
                    size="small"
                    startIcon={<EditOutlined sx={{ fontSize: 14 }} />}
                    onClick={handleOpenEdit}
                  >
                    Editar
                  </Button>
                </Box>
              </Stack>
            </Box>
          </Box>

          <Divider />

          <PaymentMethodsSection
            methods={methods}
            onAdd={addMethod}
            onUpdate={updateMethod}
            onRemove={removeMethod}
            isSavingMethod={isSavingMethod}
          />
        </Stack>
      </Page>

      <CardContractEditDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleEditSave}
        contract={contract}
        formKey={editFormKey}
        isSaving={isUpdatingContract}
      />
    </>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <Stack spacing={0}>
      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {value}
      </Typography>
    </Stack>
  );
}
