import { normalizeCategoryHex } from '@/features/clinic/lib/normalize-category-hex';

/** @deprecated Prefer `normalizeCategoryHex` — mantido para call sites existentes. */
export function getPatientCategoryColorHex(colorId: string): string {
  return normalizeCategoryHex(colorId);
}
