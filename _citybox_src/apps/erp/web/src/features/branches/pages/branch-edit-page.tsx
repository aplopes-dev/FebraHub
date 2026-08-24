"use client";

import { useMemo } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { EntityFormHeader } from "@/components/ui/form";
import { BranchFormView } from "@/features/branches/components/branch-form-view";
import { useBranchQuery } from "@/features/branches/hooks/use-branch-queries";
import { branchToFormValues } from "@/features/branches/types/branch";

const LIST_PATH = "/configuracoes/unidades-filiais";

type BranchEditPageProps = {
  branchId: string;
};

export function BranchEditPage({ branchId }: BranchEditPageProps) {
  const { data: branch, isLoading, isError } = useBranchQuery(branchId);

  const initialValues = useMemo(
    () => (branch ? branchToFormValues(branch) : undefined),
    [branch],
  );

  if (isLoading) {
    return (
      <Stack spacing={4}>
        <EntityFormHeader title="Carregando…" backHref={LIST_PATH} />
        <Typography variant="body2" color="text.secondary">
          Carregando os dados da unidade…
        </Typography>
      </Stack>
    );
  }

  if (isError || !branch || !initialValues) {
    return (
      <Stack spacing={4}>
        <EntityFormHeader title="Unidade não encontrada" backHref={LIST_PATH} />
        <Typography variant="body2" color="text.secondary">
          Esta unidade não existe ou não pertence à empresa ativa.
        </Typography>
      </Stack>
    );
  }

  return (
    <BranchFormView
      title={branch.displayName}
      subtitle="Unidades e Filiais"
      branchId={branch.id}
      initialValues={initialValues}
    />
  );
}
