import type { PatientCategory } from '../../../../domain/entities/patient-category.entity';

export function toPatientCategoryResponse(category: PatientCategory) {
  return {
    id: category.id,
    name: category.name,
    colorId: category.colorId,
    isProtected: category.isProtected,
  };
}
