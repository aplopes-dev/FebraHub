import type {
  CostCenterDto,
  SaveCostCenterPayload,
} from "@/features/cost-centers/api/cost-center.dto";
import type {
  CostCenter,
  CostCenterFormValues,
} from "@/features/cost-centers/types/cost-center";

export function toCostCenter(dto: CostCenterDto): CostCenter {
  return {
    id: dto.id,
    name: dto.name,
    isSystem: dto.isSystem,
    deletedAt: dto.deletedAt,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function toSaveCostCenterPayload(
  values: CostCenterFormValues,
): SaveCostCenterPayload {
  return {
    name: values.name.trim(),
  };
}

export function costCenterToFormValues(
  costCenter: CostCenter,
): CostCenterFormValues {
  return { name: costCenter.name };
}

export function createEmptyCostCenterFormValues(): CostCenterFormValues {
  return { name: "" };
}
