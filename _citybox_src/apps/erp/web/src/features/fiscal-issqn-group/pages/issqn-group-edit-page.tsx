"use client";

import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Alert from "@mui/material/Alert";
import { PageHeader } from "@citybox/mui";
import { BackButton, FiscalScrollablePage } from "@/components/ui/form";
import { IssqnGroupFormView } from "../components/issqn-group-form-view";
import { useIssqnGroupQuery } from "../hooks/use-issqn-groups";

const LIST_PATH = "/configuracoes/fiscal/grupos-issqn";

export function IssqnGroupEditPage({ groupId }: { groupId: string }) {
  const groupQuery = useIssqnGroupQuery(groupId);

  return (
    <FiscalScrollablePage>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <BackButton href={LIST_PATH} label="Voltar para grupos" />
        <PageHeader title="Editar grupo de ISSQN" />
        {groupQuery.isPending ? (
          <Skeleton variant="rounded" height={280} />
        ) : groupQuery.isError || !groupQuery.data ? (
          <Alert severity="error">Grupo de ISSQN não encontrado.</Alert>
        ) : (
          <IssqnGroupFormView group={groupQuery.data} />
        )}
      </Box>
    </FiscalScrollablePage>
  );
}
