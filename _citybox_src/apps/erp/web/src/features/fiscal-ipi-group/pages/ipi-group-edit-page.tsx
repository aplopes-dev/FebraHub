"use client";

import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Alert from "@mui/material/Alert";
import { PageHeader } from "@citybox/mui";
import { BackButton, FiscalScrollablePage } from "@/components/ui/form";
import { IpiGroupFormView } from "../components/ipi-group-form-view";
import { useIpiGroupQuery } from "../hooks/use-ipi-groups";

const LIST_PATH = "/configuracoes/fiscal/grupos-ipi";

export function IpiGroupEditPage({ groupId }: { groupId: string }) {
  const groupQuery = useIpiGroupQuery(groupId);

  return (
    <FiscalScrollablePage>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <BackButton href={LIST_PATH} label="Voltar para grupos" />
        <PageHeader title="Editar grupo do IPI" />
        {groupQuery.isPending ? (
          <Skeleton variant="rounded" height={280} />
        ) : groupQuery.isError || !groupQuery.data ? (
          <Alert severity="error">Grupo de IPI não encontrado.</Alert>
        ) : (
          // key por id: força remontar o form ao navegar entre dois grupos (o
          // useState só semeia `initial` no mount) — senão os valores do grupo
          // anterior virariam a baseline "salva" do novo (achado react-review).
          <IpiGroupFormView key={groupQuery.data.id} group={groupQuery.data} />
        )}
      </Box>
    </FiscalScrollablePage>
  );
}
