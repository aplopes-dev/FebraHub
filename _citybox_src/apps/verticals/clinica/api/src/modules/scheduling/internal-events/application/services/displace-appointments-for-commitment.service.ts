import { Injectable } from '@nestjs/common';
import type { AppointmentStatus } from '../../../shared/domain/appointment-types';
import type { FitInShift } from '../../../shared/domain/scheduling-enums';
import { AppointmentRepository } from '../../../appointments/domain/repositories/appointment.repository.interface';
import { FitIn } from '../../../fit-ins/domain/entities/fit-in.entity';
import { FitInRepository } from '../../../fit-ins/domain/repositories/fit-in.repository.interface';
import { CommitmentOverlapsInProgressAppointmentError } from '../../domain/errors/commitment-overlaps-in-progress.error';

export type DisplacedAppointmentSummary = {
  appointmentId: string;
  fitInId: string;
  patientId: string;
};

function isDisplaceable(status: AppointmentStatus): boolean {
  return (
    status === 'scheduled' ||
    status === 'confirmed' ||
    status === 'patient_waiting'
  );
}

function shiftFromStartAt(startAt: Date): FitInShift {
  // Horários são wall-clock gravados como UTC literal (09:00 local → T09:00:00.000Z).
  return startAt.getUTCHours() < 12 ? 'morning' : 'afternoon';
}

function fitInDateFromStartAt(startAt: Date): Date {
  return new Date(`${startAt.toISOString().slice(0, 10)}T00:00:00.000Z`);
}

/**
 * Quando um compromisso (inesperado) cobre consultas existentes:
 * - `in_progress` → bloqueia o save do compromisso (`assertNoInProgress`)
 * - `scheduled` | `confirmed` | `patient_waiting` → cancela (`cancelled_pro`) e cria FitIn pending
 *
 * Ordem nos use cases: assert → save compromisso → displace (evita cancelar consulta
 * se o save do compromisso falhar).
 */
@Injectable()
export class DisplaceAppointmentsForCommitmentService {
  constructor(
    private readonly appointments: AppointmentRepository,
    private readonly fitIns: FitInRepository,
  ) {}

  async assertNoInProgress(params: {
    context: string;
    storeId: string;
    professionalId: string;
    rangeStart: Date;
    rangeEnd: Date;
  }): Promise<void> {
    const blocking = await this.appointments.findBlockingByProfessionalAndRange(
      params.storeId,
      params.professionalId,
      params.rangeStart,
      params.rangeEnd,
    );

    if (blocking.some((appointment) => appointment.status === 'in_progress')) {
      throw new CommitmentOverlapsInProgressAppointmentError(params.context);
    }
  }

  async displace(params: {
    storeId: string;
    professionalId: string;
    rangeStart: Date;
    rangeEnd: Date;
    commitmentTitle: string;
  }): Promise<DisplacedAppointmentSummary[]> {
    const blocking = await this.appointments.findBlockingByProfessionalAndRange(
      params.storeId,
      params.professionalId,
      params.rangeStart,
      params.rangeEnd,
    );

    const displaceable = blocking.filter((appointment) =>
      isDisplaceable(appointment.status),
    );

    const displaced: DisplacedAppointmentSummary[] = [];
    const title = params.commitmentTitle.trim() || 'Compromisso';

    for (const appointment of displaceable) {
      appointment.updateStatus('cancelled_pro');
      await this.appointments.save(appointment);

      const fitIn = FitIn.create({
        storeId: params.storeId,
        patientId: appointment.patientId,
        professionalId: appointment.professionalId,
        categoryId: appointment.categoryId,
        fitInDate: fitInDateFromStartAt(appointment.startAt),
        anyDate: false,
        shifts: [shiftFromStartAt(appointment.startAt)],
        planName: null,
        observation: `Deslocado pelo compromisso: ${title}`,
        isUrgent: false,
        status: 'pending',
      });

      const savedFitIn = await this.fitIns.save(fitIn);

      displaced.push({
        appointmentId: appointment.id,
        fitInId: savedFitIn.fitIn.id,
        patientId: appointment.patientId,
      });
    }

    return displaced;
  }
}
