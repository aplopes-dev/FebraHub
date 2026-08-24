import { DomainError } from '../../../../../shared/core/errors/domain.error';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import type { AppointmentStatus } from '../../../shared/domain/appointment-types';

export class AppointmentNotFoundError extends DomainError {
  constructor(context: string, appointmentId: string) {
    super({
      internalMessage: `Appointment not found: ${appointmentId}`,
      externalMessage: 'Agendamento não encontrado',
      context,
    });
  }
}

export class AppointmentSlotTakenError extends DomainError {
  constructor(context: string) {
    super({
      internalMessage: 'Appointment slot overlap for professional',
      externalMessage: 'Horário indisponível para este profissional',
      context,
    });
  }
}

export class AppointmentOutsideClinicHoursError extends DomainError {
  constructor(context: string) {
    super({
      internalMessage: 'Appointment outside clinic operating hours',
      externalMessage:
        'Horário fora do funcionamento da clínica. Ajuste o horário de abertura/fechamento em Configurações ou escolha outro horário.',
      context,
    });
  }
}

export class AppointmentFrozenError extends DomainError {
  constructor(context: string, appointmentId: string) {
    super({
      internalMessage: `Appointment is frozen: ${appointmentId}`,
      externalMessage: 'Agendamento não pode ser alterado neste status',
      context,
    });
  }
}

export class AppointmentInvalidStatusTransitionError extends ValidatorDomainError {
  constructor(context: string, from: AppointmentStatus, to: AppointmentStatus) {
    super({
      internalMessage: `Invalid appointment status transition: ${from} -> ${to}`,
      externalMessage:
        'Não é possível alterar para este status a partir do status atual. Avance pelas etapas permitidas (ex.: Paciente aguardando → Em atendimento → Finalizada).',
      context,
    });
  }
}
