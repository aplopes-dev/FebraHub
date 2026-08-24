import { randomUUID } from 'crypto';

import { Appointment } from '../../../domain/entities/appointment.entity';

import {
  AppointmentInvalidStatusTransitionError,
  AppointmentSlotTakenError,
} from '../../../domain/errors/appointment.errors';

import { ReturnAlert } from '../../../../return-alerts/domain/entities/return-alert.entity';

import {
  ReturnAlertRepository,
  type ReturnAlertDetail,
} from '../../../../return-alerts/domain/repositories/return-alert.repository.interface';

import { InternalEventRepository } from '../../../../internal-events/domain/repositories/internal-event.repository.interface';

import { InMemoryAppointmentRepository } from '../../../tests/in-memory-appointment.repository';

import { AssertAppointmentSlotAvailableService } from '../../services/assert-appointment-slot-available.service';
import { ReturnAlertSyncService } from '../../services/return-alert-sync.service';
import { InMemoryClinicStoreProfileRepository } from '../../../../../clinic-profile/tests/in-memory-clinic-store-profile.repository';

import { UpdateAppointmentStatusUseCase } from './update-appointment-status.use-case';

class InMemoryReturnAlertRepository extends ReturnAlertRepository {
  readonly saved: ReturnAlert[] = [];

  async findById(): Promise<ReturnAlertDetail | null> {
    return null;
  }

  async findByAppointmentId(
    _storeId: string,
    appointmentId: string,
  ): Promise<ReturnAlert | null> {
    return this.saved.find((a) => a.appointmentId === appointmentId) ?? null;
  }

  async findMany(): Promise<ReturnAlertDetail[]> {
    return [];
  }

  async count(): Promise<number> {
    return 0;
  }

  async save(alert: ReturnAlert): Promise<ReturnAlertDetail> {
    const id = alert.id || randomUUID();

    const saved = ReturnAlert.with(
      {
        storeId: alert.storeId,
        patientId: alert.patientId,
        professionalId: alert.professionalId,
        appointmentId: alert.appointmentId,
        dueDate: alert.dueDate,
        reason: alert.reason,
        source: alert.source,
        createdAt: alert.createdAt,
        updatedAt: alert.updatedAt,
      },
      id,
    );

    const existingIndex = this.saved.findIndex((row) => row.id === id);

    if (existingIndex >= 0) {
      this.saved[existingIndex] = saved;
    } else {
      this.saved.push(saved);
    }

    return {
      alert: saved,
      patientName: 'Paciente',
      patientPhone: null,
    };
  }

  async delete(): Promise<void> {}
}

describe('UpdateAppointmentStatusUseCase', () => {
  const storeId = 'store-a';

  let appointmentRepo: InMemoryAppointmentRepository;
  let returnAlertRepo: InMemoryReturnAlertRepository;
  let internalEventRepo: jest.Mocked<
    Pick<InternalEventRepository, 'findForCalendar'>
  >;
  let useCase: UpdateAppointmentStatusUseCase;

  beforeEach(() => {
    appointmentRepo = new InMemoryAppointmentRepository();
    returnAlertRepo = new InMemoryReturnAlertRepository();
    internalEventRepo = {
      findForCalendar: jest.fn().mockResolvedValue([]),
    };

    useCase = new UpdateAppointmentStatusUseCase(
      appointmentRepo,
      new ReturnAlertSyncService(returnAlertRepo),
      new AssertAppointmentSlotAvailableService(
        appointmentRepo,
        internalEventRepo as unknown as InternalEventRepository,
        new InMemoryClinicStoreProfileRepository(),
      ),
    );
  });

  async function seedAppointment(status: Appointment['status'] = 'scheduled') {
    const appointment = Appointment.create({
      storeId,
      patientId: 'patient-1',
      professionalId: 'pro-1',
      procedureId: null,
      roomId: null,
      categoryId: null,
      channel: null,
      insuranceType: 'private',
      startAt: new Date('2026-07-10T14:00:00.000Z'),
      endAt: new Date('2026-07-10T14:30:00.000Z'),
      durationMin: 30,
      notes: null,
      returnOption: 'one_month',
      returnDate: null,
      returnReason: 'Retorno de rotina',
      fitInId: null,
      status,
    });

    const detail = await appointmentRepo.save(appointment);

    return detail.appointment.id;
  }

  it('rejects invalid status transition', async () => {
    const id = await seedAppointment('finished');

    await expect(
      useCase.execute({ storeId, id, status: 'scheduled' }),
    ).rejects.toBeInstanceOf(AppointmentInvalidStatusTransitionError);
  });

  it('creates return alert when finishing appointment with return option', async () => {
    const id = await seedAppointment('in_progress');

    await useCase.execute({ storeId, id, status: 'finished' });

    expect(returnAlertRepo.saved).toHaveLength(1);
    expect(returnAlertRepo.saved[0]?.source).toBe('auto');
    expect(returnAlertRepo.saved[0]?.appointmentId).toBe(id);
    expect(returnAlertRepo.saved[0]?.reason).toBe('Retorno de rotina');
  });

  it('allows correcting cancel reason between patient and professional', async () => {
    const id = await seedAppointment('cancelled_patient');

    const result = await useCase.execute({
      storeId,
      id,
      status: 'cancelled_pro',
    });

    expect(result.status).toBe('cancelled_pro');
  });

  it('allows reopening cancelled appointment to scheduled', async () => {
    const id = await seedAppointment('cancelled_patient');

    const result = await useCase.execute({
      storeId,
      id,
      status: 'scheduled',
    });

    expect(result.status).toBe('scheduled');
  });

  it('rejects reopen when another appointment occupies the slot', async () => {
    const cancelledId = await seedAppointment('cancelled_pro');

    await appointmentRepo.save(
      Appointment.create({
        storeId,
        patientId: 'patient-2',
        professionalId: 'pro-1',
        procedureId: null,
        roomId: null,
        categoryId: null,
        channel: null,
        insuranceType: 'private',
        startAt: new Date('2026-07-10T14:00:00.000Z'),
        endAt: new Date('2026-07-10T14:30:00.000Z'),
        durationMin: 30,
        notes: null,
        returnOption: null,
        returnDate: null,
        returnReason: null,
        fitInId: null,
        status: 'scheduled',
      }),
    );

    await expect(
      useCase.execute({ storeId, id: cancelledId, status: 'scheduled' }),
    ).rejects.toBeInstanceOf(AppointmentSlotTakenError);
  });
});
