"use client";

import { useMemo } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { EntityFormHeader } from "@/components/ui/form";
import { BranchFormView } from "@/features/branches/components/branch-form-view";
import {
  useBranchQuery,
  useMatrixQuery,
} from "@/features/branches/hooks/use-branch-queries";
import {
  branchToFormValues,
  createEmptyBranchFormValues,
  createStoreFormValuesFromMatrix,
} from "@/features/branches/types/branch";

const LIST_PATH = "/settings/units";

type MatrixEditPageProps = {
  matrixId: string;
};

export function MatrixEditPage({ matrixId }: MatrixEditPageProps) {
  const { data: matrix, isLoading, isError } = useMatrixQuery(matrixId);

  const initialValues = useMemo(
    () => (matrix ? branchToFormValues(matrix) : undefined),
    [matrix],
  );

  if (isLoading) {
    return (
      <Stack spacing={4}>
        <EntityFormHeader title="Carregando…" backHref={LIST_PATH} />
        <Typography variant="body2" color="text.secondary">
          Carregando os dados da empresa matriz…
        </Typography>
      </Stack>
    );
  }

  if (isError || !matrix || !initialValues) {
    return (
      <Stack spacing={4}>
        <EntityFormHeader
          title="Empresa matriz não encontrada"
          backHref={LIST_PATH}
        />
        <Typography variant="body2" color="text.secondary">
          Esta empresa matriz não existe ou não pertence ao grupo ativo.
        </Typography>
      </Stack>
    );
  }

  return (
    <BranchFormView
      title={matrix.displayName}
      subtitle="Empresa matriz"
      unitKind="matrix"
      unitId={matrix.id}
      initialValues={initialValues}
      initialHasLogo={matrix.hasLogo}
      initialLogoCacheKey={matrix.updatedAt}
    />
  );
}

type StoreCreatePageProps = {
  matrixId: string;
};

export function StoreCreatePage({ matrixId }: StoreCreatePageProps) {
  const { data: matrix, isLoading, isError } = useMatrixQuery(matrixId);

  const initialValues = useMemo(
    () =>
      matrix
        ? createStoreFormValuesFromMatrix(matrix)
        : createEmptyBranchFormValues(),
    [matrix],
  );

  if (isLoading) {
    return (
      <Stack spacing={4}>
        <EntityFormHeader title="Nova filial" backHref={LIST_PATH} />
        <Typography variant="body2" color="text.secondary">
          Carregando dados da empresa matriz…
        </Typography>
      </Stack>
    );
  }

  return (
    <BranchFormView
      key={matrix?.id ?? "empty"}
      title="Nova filial"
      subtitle="Matrizes e Filiais"
      unitKind="store"
      matrixId={matrixId}
      initialValues={isError ? createEmptyBranchFormValues() : initialValues}
    />
  );
}

type StoreEditPageProps = {
  storeId: string;
};

export function StoreEditPage({ storeId }: StoreEditPageProps) {
  const { data: store, isLoading, isError } = useBranchQuery(storeId);

  const initialValues = useMemo(
    () => (store ? branchToFormValues(store) : undefined),
    [store],
  );

  if (isLoading) {
    return (
      <Stack spacing={4}>
        <EntityFormHeader title="Carregando…" backHref={LIST_PATH} />
        <Typography variant="body2" color="text.secondary">
          Carregando os dados da loja…
        </Typography>
      </Stack>
    );
  }

  if (isError || !store || !initialValues) {
    return (
      <Stack spacing={4}>
        <EntityFormHeader title="Filial não encontrada" backHref={LIST_PATH} />
        <Typography variant="body2" color="text.secondary">
          Esta filial não existe ou não pertence ao grupo ativo.
        </Typography>
      </Stack>
    );
  }

  return (
    <BranchFormView
      title={store.displayName}
      subtitle="Matrizes e Filiais"
      unitKind="store"
      unitId={store.id}
      matrixId={store.matrixId ?? undefined}
      initialValues={initialValues}
      initialHasLogo={store.hasLogo}
      initialLogoCacheKey={store.updatedAt}
    />
  );
}
