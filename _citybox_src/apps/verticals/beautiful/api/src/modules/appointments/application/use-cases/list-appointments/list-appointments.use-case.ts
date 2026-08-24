import { Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../../shared/core/use-case.interface';
import { AppointmentEntity } from '../../../domain/entities/appointment.entity';
import {
  AppointmentRepository,
  ListAppointmentsFilter,
} from '../../../domain/repositories/appointment.repository.interface';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type ListAppointmentsInput = ListAppointmentsFilter & {
  storeId: string;
};

@Injectable()
export class ListAppointmentsUseCase implements IUseCase<
  ListAppointmentsInput,
  AppointmentEntity[]
> {
  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  async execute(input: ListAppointmentsInput): Promise<AppointmentEntity[]> {
    if (!DATE_RE.test(input.from) || !DATE_RE.test(input.to)) {
      throw new ValidatorDomainError({
        internalMessage: `Invalid from/to dates: ${input.from} .. ${input.to}`,
        externalMessage: 'Informe o período com datas no formato AAAA-MM-DD.',
        context: 'Appointments',
      });
    }

    if (input.from > input.to) {
      throw new ValidatorDomainError({
        internalMessage: `from (${input.from}) is after to (${input.to})`,
        externalMessage: 'A data inicial não pode ser posterior à data final.',
        context: 'Appointments',
      });
    }

    const { storeId, ...filter } = input;
    return this.appointmentRepository.findAll(storeId, filter);
  }
}
