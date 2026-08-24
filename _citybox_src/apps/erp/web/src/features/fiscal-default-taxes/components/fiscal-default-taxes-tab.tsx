"use client";

import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import {
  useFiscalDefaultTaxesQuery,
  useFiscalGroupsQuery,
} from "../hooks/use-fiscal-default-taxes";
import { FiscalDefaultTaxesHub } from "./fiscal-default-taxes-hub";

/** Aba "Padrões fiscais" da tela Fiscal (spec erp/014). */
export function FiscalDefaultTaxesTab() {
  const groupsQuery = useFiscalGroupsQuery();
  const defaultsQuery = useFiscalDefaultTaxesQuery();

  // `isPending` (não `isLoading`) cobre o estado "query desabilitada até o escopo
  // da org resolver": nesse ponto isLoading=false e data=undefined cairia no erro.
  if (groupsQuery.isPending || defaultsQuery.isPending) {
    return (
      <Stack spacing={2} sx={{ mt: 1 }}>
        <Skeleton variant="rounded" height={90} />
        <Skeleton variant="rounded" height={220} />
      </Stack>
    );
  }

  if (groupsQuery.isError || defaultsQuery.isError || !defaultsQuery.data) {
    return (
      <Alert severity="error" sx={{ mt: 1 }}>
        Não foi possível carregar os padrões fiscais. Tente novamente.
      </Alert>
    );
  }

  return (
    <FiscalDefaultTaxesHub
      key={defaultsQuery.data.updatedAt}
      defaults={defaultsQuery.data}
      groups={groupsQuery.data ?? []}
    />
  );
}
