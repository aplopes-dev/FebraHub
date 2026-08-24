"use client";

import ReceiptLongOutlined from "@mui/icons-material/ReceiptLongOutlined";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import { EmptyState, PageHeader } from "@citybox/mui";
import { BackButton, FiscalScrollablePage } from "@/components/ui/form";
import { ListLoadErrorAlert } from "@/components/ui/list-page";
import { useEmitterRegime } from "@/features/fiscal-pis-cofins-group/hooks/use-emitter-regime";
import { IcmsGroupFormView } from "../components/icms-group-form-view";
import { useIcmsGroupQuery } from "../hooks/use-icms-groups";

const LIST_PATH = "/configuracoes/fiscal/grupos-icms";

export function IcmsGroupEditPage({ groupId }: { groupId: string }) {
  const groupQuery = useIcmsGroupQuery(groupId);
  const {
    regime,
    isLoading: regimeLoading,
    isError: regimeIsError,
  } = useEmitterRegime();

  if (groupQuery.isPending || regimeLoading) {
    return (
      <FiscalScrollablePage>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <BackButton href={LIST_PATH} label="Voltar para grupos" />
          <Skeleton variant="rounded" height={320} />
        </Box>
      </FiscalScrollablePage>
    );
  }

  if (groupQuery.isError || regimeIsError) {
    return (
      <FiscalScrollablePage>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <BackButton href={LIST_PATH} label="Voltar para grupos" />
          <ListLoadErrorAlert
            title="Não foi possível carregar o grupo ou o regime do Emitente"
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
          <PageHeader title="Grupo de ICMS" />
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
        <PageHeader title={group.name} description="Editar grupo do ICMS" />
        <IcmsGroupFormView key={group.updatedAt} group={group} regime={regime} />
      </Box>
    </FiscalScrollablePage>
  );
}
