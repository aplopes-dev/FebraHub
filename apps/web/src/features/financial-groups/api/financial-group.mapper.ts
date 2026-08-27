import type {
  FinancialGroupDto,
  SaveFinancialGroupPayload,
} from "@/features/financial-groups/api/financial-group.dto";
import type {
  FinancialGroup,
  FinancialGroupFormValues,
  FinancialGroupOption,
} from "@/features/financial-groups/types/financial-group";

export function toFinancialGroup(dto: FinancialGroupDto): FinancialGroup {
  return {
    id: dto.id,
    name: dto.name,
    type: dto.type,
    isSystem: dto.isSystem,
    deletedAt: dto.deletedAt,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function toFinancialGroupOption(
  dto: FinancialGroupDto,
): FinancialGroupOption {
  return {
    id: dto.id,
    name: dto.name,
    type: dto.type,
  };
}

export function toSaveFinancialGroupPayload(
  values: FinancialGroupFormValues,
): SaveFinancialGroupPayload {
  return {
    name: values.name.trim(),
    type: values.type,
  };
}

export function financialGroupToFormValues(
  group: FinancialGroup,
): FinancialGroupFormValues {
  return {
    name: group.name,
    type: group.type,
  };
}

export function createEmptyFinancialGroupFormValues(): FinancialGroupFormValues {
  return {
    name: "",
    type: "receita",
  };
}
