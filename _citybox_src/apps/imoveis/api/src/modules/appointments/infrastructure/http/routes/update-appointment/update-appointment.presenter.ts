import type { AppointmentEntity } from '../../../../domain/entities/appointment.entity';
import { mapAppointmentToHttp } from '../shared/appointment-response.mapper';

export class UpdateAppointmentPresenter {
  static toHttp(appointment: AppointmentEntity) {
    return { data: mapAppointmentToHttp(appointment) };
  }
}
