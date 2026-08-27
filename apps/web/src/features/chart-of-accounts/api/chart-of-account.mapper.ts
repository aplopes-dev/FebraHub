import type {
  ChartOfAccountDto,
  SaveChartOfAccountPayload,
} from "@/features/chart-of-accounts/api/chart-of-account.dto";
import type {
  ChartOfAccount,
  ChartOfAccountFormValues,
} from "@/features/chart-of-accounts/types/chart-of-account";

export function toChartOfAccount(dto: ChartOfAccountDto): ChartOfAccount {
  return {
    id: dto.id,
    name: dto.name,
    financialGroupId: dto.financialGroupId,
    financialGroupName: dto.financialGroupName,
    financialGroupType: dto.financialGroupType,
    availableForPdv: dto.availableForPdv,
    isSystem: dto.isSystem,
    deletedAt: dto.deletedAt,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function toSaveChartOfAccountPayload(
  values: ChartOfAccountFormValues,
): SaveChartOfAccountPayload {
  return {
    name: values.name.trim(),
    financialGroupId: values.financialGroupId,
    availableForPdv: values.availableForPdv,
  };
}

export function chartOfAccountToFormValues(
  account: ChartOfAccount,
): ChartOfAccountFormValues {
  return {
    name: account.name,
    financialGroupId: account.financialGroupId,
    availableForPdv: account.availableForPdv,
  };
}

export function createEmptyChartOfAccountFormValues(): ChartOfAccountFormValues {
  return {
    name: "",
    financialGroupId: "",
    availableForPdv: false,
  };
}
