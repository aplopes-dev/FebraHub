"use client";

import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import { PageHeader } from "@citybox/mui";
import { BackButton, FiscalScrollablePage } from "@/components/ui/form";
import { OperationNatureFormView } from "../components/operation-nature-form-view";
import { useOperationNatureQuery } from "../hooks/use-operation-natures";

const LIST_PATH = "/configuracoes/fiscal/naturezas-operacao";

export function OperationNatureEditPage({ natureId }: { natureId: string }) {
  const natureQuery = useOperationNatureQuery(natureId);

  return (
    <FiscalScrollablePage>
      <Stack spacing={2}>
        <BackButton
          href={LIST_PATH}
          label="Voltar para naturezas de operação"
        />
        <PageHeader title="Editar natureza de operação" />
        {natureQuery.isPending ? (
          <Skeleton variant="rounded" height={280} />
        ) : natureQuery.isError || !natureQuery.data ? (
          <Alert severity="error">Natureza de operação não encontrada.</Alert>
        ) : (
          // key por id: força remontar o form ao navegar entre duas naturezas
          // (achado react-review recorrente nas features irmãs 016/018/019).
          <OperationNatureFormView
            key={natureQuery.data.id}
            nature={natureQuery.data}
          />
        )}
      </Stack>
    </FiscalScrollablePage>
  );
}
