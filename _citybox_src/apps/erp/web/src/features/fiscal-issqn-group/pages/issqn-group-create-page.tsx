"use client";

import Box from "@mui/material/Box";
import { PageHeader } from "@citybox/mui";
import { BackButton, FiscalScrollablePage } from "@/components/ui/form";
import { IssqnGroupFormView } from "../components/issqn-group-form-view";

const LIST_PATH = "/configuracoes/fiscal/grupos-issqn";

export function IssqnGroupCreatePage() {
  return (
    <FiscalScrollablePage>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <BackButton href={LIST_PATH} label="Voltar para grupos" />
        <PageHeader title="Novo grupo de ISSQN" />
        <IssqnGroupFormView />
      </Box>
    </FiscalScrollablePage>
  );
}
