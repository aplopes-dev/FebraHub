"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { EntityFormHeader } from "@/components/ui/form";
import {
  useBranchQuery,
  useMatrixQuery,
} from "@/features/branches/hooks/use-branch-queries";

const LIST_PATH = "/settings/units";

type LegacyUnitRedirectPageProps = {
  unitId: string;
};

/** Redireciona rotas legadas `/settings/units/[id]` para matriz ou loja. */
export function LegacyUnitRedirectPage({ unitId }: LegacyUnitRedirectPageProps) {
  const router = useRouter();
  const matrixQuery = useMatrixQuery(unitId);
  const storeQuery = useBranchQuery(unitId);

  const matrix = matrixQuery.data;
  const store = storeQuery.data;
  const isLoading = matrixQuery.isLoading || storeQuery.isLoading;
  const isError =
    !isLoading && matrixQuery.isError && storeQuery.isError;

  useEffect(() => {
    if (matrix) {
      router.replace(`/settings/units/matrices/${matrix.id}`);
      return;
    }
    if (store) {
      router.replace(`/settings/units/stores/${store.id}`);
    }
  }, [matrix, store, router]);

  if (isError) {
    return (
      <Stack spacing={4}>
        <EntityFormHeader title="Unidade não encontrada" backHref={LIST_PATH} />
        <Typography variant="body2" color="text.secondary">
          Esta unidade não existe ou não pertence ao grupo ativo.
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={4}>
      <EntityFormHeader title="Carregando…" backHref={LIST_PATH} />
      <Typography variant="body2" color="text.secondary">
        Redirecionando…
      </Typography>
    </Stack>
  );
}
