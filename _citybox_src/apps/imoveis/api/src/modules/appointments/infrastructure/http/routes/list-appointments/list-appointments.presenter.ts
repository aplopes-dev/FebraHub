import type { AppointmentEntity } from '../../../../domain/entities/appointment.entity';
import { mapAppointmentToHttp } from '../shared/appointment-response.mapper';

export class ListAppointmentsPresenter {
  static toHttp(
    items: AppointmentEntity[],
    meta: { total: number; page: number; perPage: number; totalPages: number },
  ) {
    return {
      data: items.map(mapAppointmentToHttp),
      meta,
    };
  }
}
