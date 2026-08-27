"use client";

import InfoOutlined from "@mui/icons-material/InfoOutlined";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { EmptyState } from "@/ui";
import { BackButton } from "@/components/ui/form";
import { FinancialEntryFormView } from "@/features/financial-entries/components/financial-entry-form/financial-entry-form-view";
import { useFinancialEntryQuery } from "@/features/financial-entries/hooks/use-financial-entry-queries";
import { financialEntryToFormValues } from "@/features/financial-entries/lib/financial-entry-form-values";

const LIST_PATH = "/financas/lancamentos";

export function FinancialEntryEditPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { data: entry, isLoading, isError } = useFinancialEntryQuery(id);

  const initialValues = useMemo(
    () => (entry ? financialEntryToFormValues(entry) : undefined),
    [entry],
  );

  if (isLoading) {
    return (
      <Box
        component="section"
        sx={{ display: "flex", flex: 1, flexDirection: "column", gap: 2, p: 2 }}
      >
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Carregando os dados do lançamento…
        </Typography>
      </Box>
    );
  }

  if (isError || !entry || !initialValues) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          textAlign: "center",
        }}
      >
        <EmptyState
          icon={<InfoOutlined sx={{ fontSize: 24 }} />}
          title="Lançamento não encontrado"
          description="O lançamento que você tentou abrir não existe mais ou foi removido."
          action={
            <BackButton href={LIST_PATH} label="Voltar para Lançamentos" />
          }
        />
      </Box>
    );
  }

  return (
    <FinancialEntryFormView
      key={entry.id}
      entryId={entry.id}
      initialValues={initialValues}
      readOnly={entry.readOnly}
      cardSettlement={{
        grossAmount: entry.grossAmount,
        acquirerFee: entry.acquirerFee,
        fallback: entry.cardSettlementFallback,
      }}
    />
  );
}
