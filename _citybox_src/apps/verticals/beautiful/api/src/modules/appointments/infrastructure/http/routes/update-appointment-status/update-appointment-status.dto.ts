import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { APPOINTMENT_STATUSES } from '../../../../domain/appointment.types';

export class UpdateAppointmentStatusHTTPDTO {
  @ApiProperty({
    description: 'Novo status do atendimento',
    enum: APPOINTMENT_STATUSES,
  })
  @IsIn([...APPOINTMENT_STATUSES])
  status: (typeof APPOINTMENT_STATUSES)[number];
}
