import {
  MOVEMENT_CATEGORY_NAME_MAX,
  type MovementCategoryFormValues,
} from "@/features/movement-categories/types/movement-category";

export function validateMovementCategoryForm(
  values: MovementCategoryFormValues,
): string | null {
  if (!values.name.trim()) return "Informe o nome da categoria.";
  if (values.type !== "entrada" && values.type !== "saida") {
    return "Selecione o tipo.";
  }
  if (values.unitIds.length === 0) {
    return "Selecione ao menos uma unidade.";
  }
  if (values.name.trim().length > MOVEMENT_CATEGORY_NAME_MAX) {
    return `Nome com no máximo ${MOVEMENT_CATEGORY_NAME_MAX} caracteres.`;
  }
  return null;
}
