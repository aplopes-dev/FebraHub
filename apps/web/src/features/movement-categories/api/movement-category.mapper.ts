import type {
  SaveMovementCategoryPayload,
  MovementCategoryDto,
} from "@/features/movement-categories/api/movement-category.dto";
import type {
  MovementCategory,
  MovementCategoryFormValues,
} from "@/features/movement-categories/types/movement-category";

export function toMovementCategory(dto: MovementCategoryDto): MovementCategory {
  return {
    id: dto.id,
    code: dto.code,
    name: dto.name,
    type: dto.type,
    unitIds: [...dto.branchIds],
    isSystem: dto.isSystem,
    systemKey: dto.systemKey,
  };
}

export function toSaveMovementCategoryPayload(
  values: MovementCategoryFormValues,
): SaveMovementCategoryPayload {
  if (values.type !== "entrada" && values.type !== "saida") {
    throw new Error("INVALID_TYPE");
  }

  return {
    name: values.name.trim(),
    type: values.type,
    branchIds: [...values.unitIds],
  };
}

export function movementCategoryToFormValues(
  category: MovementCategory,
): MovementCategoryFormValues {
  return {
    name: category.name,
    type: category.type,
    unitIds: [...category.unitIds],
  };
}

export function createEmptyMovementCategoryFormValues(
  unitIds: string[] = [],
): MovementCategoryFormValues {
  return {
    name: "",
    type: "",
    unitIds: [...unitIds],
  };
}
