import {
  DEFAULT_CATEGORY_HEX,
  normalizeCategoryHex,
} from '@/features/clinic/lib/normalize-category-hex';

export const DEFAULT_APPOINTMENT_CATEGORY_COLOR = DEFAULT_CATEGORY_HEX;

/** Resolve cor de categoria de agendamento (hex ou id nomeado legado) para `#rrggbb`. */
export function resolveAppointmentCategoryColor(color: string): string {
  return normalizeCategoryHex(color);
}
