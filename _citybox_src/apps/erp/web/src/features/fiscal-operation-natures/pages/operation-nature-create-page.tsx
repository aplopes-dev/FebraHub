"use client";

import Stack from "@mui/material/Stack";
import { PageHeader } from "@citybox/mui";
import { BackButton, FiscalScrollablePage } from "@/components/ui/form";
import { OperationNatureFormView } from "../components/operation-nature-form-view";

const LIST_PATH = "/configuracoes/fiscal/naturezas-operacao";

export function OperationNatureCreatePage() {
  return (
    <FiscalScrollablePage>
      <Stack spacing={2}>
        <BackButton
          href={LIST_PATH}
          label="Voltar para naturezas de operação"
        />
        <PageHeader title="Nova natureza de operação" />
        <OperationNatureFormView />
      </Stack>
    </FiscalScrollablePage>
  );
}
