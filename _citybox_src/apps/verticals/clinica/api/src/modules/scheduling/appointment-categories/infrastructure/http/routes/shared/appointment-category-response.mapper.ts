import type { AppointmentCategorySummary } from '../../../../application/dtos/appointment-category.dto';

export function toAppointmentCategoryResponse(
  item: AppointmentCategorySummary,
) {
  return {
    id: item.id,
    name: item.name,
    color: item.color,
    appointmentCount: item.appointmentCount,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}
