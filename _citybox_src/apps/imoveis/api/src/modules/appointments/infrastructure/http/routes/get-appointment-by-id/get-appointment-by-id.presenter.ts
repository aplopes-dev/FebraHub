import type { AppointmentEntity } from '../../../../domain/entities/appointment.entity';
import { mapAppointmentToHttp } from '../shared/appointment-response.mapper';

export class GetAppointmentByIdPresenter {
  static toHttp(appointment: AppointmentEntity) {
    return { data: mapAppointmentToHttp(appointment) };
  }
}
