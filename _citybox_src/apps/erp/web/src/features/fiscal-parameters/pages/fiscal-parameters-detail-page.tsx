"use client";

import ReceiptOutlined from "@mui/icons-material/ReceiptOutlined";

import { Box, EmptyState, PageHeader } from "@citybox/mui";
import { BackButton } from "@/components/ui/form";
import { ListLoadErrorAlert } from "@/components/ui/list-page";
import { FiscalParametersFormView } from "@/features/fiscal-parameters/components/fiscal-parameters-form-view";
import { FiscalParametersDetailSkeleton } from "@/features/fiscal-parameters/components/fiscal-parameters-detail-skeleton";
import { useUpsertFiscalParametersMutation } from "@/features/fiscal-parameters/hooks/use-fiscal-parameters-mutations";
import { useFiscalParametersDetailQuery } from "@/features/fiscal-parameters/hooks/use-fiscal-parameters-queries";
import type { FiscalInheritedLabels } from "@/features/fiscal-parameters/components/fiscal-settings-section";
import { CFOP_OPTIONS } from "@/features/fiscal-parameters/data/fiscal-options";
import {
  useFiscalDefaultTaxesQuery,
  useFiscalGroupsQuery,
} from "@/features/fiscal-default-taxes/hooks/use-fiscal-default-taxes";
import { useOrganization } from "@/lib/organization-context";

type FiscalParametersDetailPageProps = {
  productId: string;
};

export function FiscalParametersDetailPage({
  productId,
}: FiscalParametersDetailPageProps) {
  const { branches } = useOrganization();
  const detailQuery = useFiscalParametersDetailQuery(productId);
  const upsertMutation = useUpsertFiscalParametersMutation(productId);
  // Padrões da organização (spec erp/014): exibidos como valor herdado nos campos
  // vazios. Herança é só de exibição — a emissão ainda não consome.
  const defaultsQuery = useFiscalDefaultTaxesQuery();
  const groupsQuery = useFiscalGroupsQuery();

  const inherited = buildInheritedLabels(
    defaultsQuery.data,
    groupsQuery.data ?? [],
  );

  if (detailQuery.isLoading) {
    return <FiscalParametersDetailSkeleton />;
  }

  if (detailQuery.isError) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <PageHeader sx={{ flexShrink: 0, mb: 0 }} title="Parâmetros fiscais" />
        <ListLoadErrorAlert
          title="Não foi possível carregar os parâmetros fiscais"
          onRetry={() => void detailQuery.refetch()}
        />
      </Box>
    );
  }

  const detail = detailQuery.data;
  if (!detail) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          gap: 2,
        }}
      >
        <PageHeader sx={{ flexShrink: 0, mb: 0 }} title="Parâmetros fiscais" />
        <EmptyState
          icon={<ReceiptOutlined sx={{ fontSize: 24 }} />}
          title="Produto não encontrado"
          description="O produto informado não existe ou não está disponível para configuração fiscal."
          action={
            <BackButton
              href="/catalogo/parametros-fiscais"
              label="Voltar para parâmetros fiscais"
            />
          }
        />
      </Box>
    );
  }

  return (
    <FiscalParametersFormView
      formKey={productId}
      productName={detail.item.name}
      initialValues={detail.formValues}
      branches={branches.map((branch) => ({
        id: branch.id,
        displayName: branch.displayName,
      }))}
      inherited={inherited}
      onSave={async (values) => {
        await upsertMutation.mutateAsync(values);
      }}
      isSaving={upsertMutation.isPending}
    />
  );
}

type FiscalDefaultTaxesData = ReturnType<
  typeof useFiscalDefaultTaxesQuery
>["data"];
type FiscalGroupData = ReturnType<typeof useFiscalGroupsQuery>["data"];

/** Resolve o rótulo do padrão da org por tributo (nome do grupo / label do CFOP). */
function buildInheritedLabels(
  defaults: FiscalDefaultTaxesData,
  groups: NonNullable<FiscalGroupData>,
): FiscalInheritedLabels {
  if (!defaults) return {};
  const nameById = new Map(groups.map((group) => [group.id, group.name]));
  const cfopLabel = defaults.cfop
    ? (CFOP_OPTIONS.find((option) => option.value === defaults.cfop)?.label ??
      defaults.cfop)
    : undefined;
  return {
    icms: defaults.icmsGroupId
      ? nameById.get(defaults.icmsGroupId)
      : undefined,
    ipi: defaults.ipiGroupId ? nameById.get(defaults.ipiGroupId) : undefined,
    pisCofins: defaults.pisCofinsGroupId
      ? nameById.get(defaults.pisCofinsGroupId)
      : undefined,
    issqn: defaults.issqnGroupId
      ? nameById.get(defaults.issqnGroupId)
      : undefined,
    cfop: cfopLabel,
  };
}
