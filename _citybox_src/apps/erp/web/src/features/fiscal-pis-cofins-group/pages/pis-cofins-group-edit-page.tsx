"use client";

import ReceiptLongOutlined from "@mui/icons-material/ReceiptLongOutlined";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import { EmptyState, PageHeader } from "@citybox/mui";
import { BackButton, FiscalScrollablePage } from "@/components/ui/form";
import { ListLoadErrorAlert } from "@/components/ui/list-page";
import { PisCofinsGroupFormView } from "../components/pis-cofins-group-form-view";
import { usePisCofinsGroupQuery } from "../hooks/use-pis-cofins-groups";
import { useEmitterRegime } from "../hooks/use-emitter-regime";

const LIST_PATH = "/configuracoes/fiscal/grupos-pis-cofins";

export function PisCofinsGroupEditPage({ groupId }: { groupId: string }) {
  const groupQuery = usePisCofinsGroupQuery(groupId);
  const { regime } = useEmitterRegime();

  if (groupQuery.isPending) {
    return (
      <FiscalScrollablePage>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <BackButton href={LIST_PATH} label="Voltar para grupos" />
          <Skeleton variant="rounded" height={280} />
        </Box>
      </FiscalScrollablePage>
    );
  }

  if (groupQuery.isError) {
    return (
      <FiscalScrollablePage>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <BackButton href={LIST_PATH} label="Voltar para grupos" />
          <ListLoadErrorAlert
            title="Não foi possível carregar o grupo"
            onRetry={() => void groupQuery.refetch()}
          />
        </Box>
      </FiscalScrollablePage>
    );
  }

  const group = groupQuery.data;
  if (!group) {
    return (
      <FiscalScrollablePage>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <PageHeader title="Grupo de PIS/COFINS" />
          <EmptyState
            icon={<ReceiptLongOutlined sx={{ fontSize: 24 }} />}
            title="Grupo não encontrado"
            description="O grupo informado não existe ou foi removido."
            action={<BackButton href={LIST_PATH} label="Voltar para grupos" />}
          />
        </Box>
      </FiscalScrollablePage>
    );
  }

  return (
    <FiscalScrollablePage>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <BackButton href={LIST_PATH} label="Voltar para grupos" />
        <PageHeader title={group.name} description="Editar grupo de PIS/COFINS" />
        <PisCofinsGroupFormView key={group.updatedAt} group={group} regime={regime} />
      </Box>
    </FiscalScrollablePage>
  );
}
