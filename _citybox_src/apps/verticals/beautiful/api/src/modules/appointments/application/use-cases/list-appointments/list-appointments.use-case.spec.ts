import { randomUUID } from 'crypto';
import { AppointmentEntity } from '../../../domain/entities/appointment.entity';
import { InMemoryAppointmentRepository } from '../../../tests/in-memory-appointment.repository';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { parseWallClock, addMinutes } from '../../utils/appointment-datetime';
import { ListAppointmentsUseCase } from './list-appointments.use-case';

const STORE_ID = '019c0000-0000-7000-8000-000000000001';
const OTHER_STORE_ID = '019c0000-0000-7000-8000-000000000002';

function makeAppointment(opts: {
  storeId?: string;
  date: string;
  startTime: string;
  duration?: number;
  professionalId?: string;
  clientId?: string;
  status?: 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED';
}) {
  const professionalId = opts.professionalId ?? randomUUID();
  const startAt = parseWallClock(opts.date, opts.startTime);
  const duration = opts.duration ?? 30;
  return AppointmentEntity.create({
    storeId: opts.storeId ?? STORE_ID,
    clientId: opts.clientId ?? randomUUID(),
    clientName: 'Cliente',
    clientPhone: '(73) 99999-0000',
    startAt,
    endAt: addMinutes(startAt, duration),
    status: opts.status ?? 'SCHEDULED',
    totalPrice: 50,
    services: [
      {
        professionalId,
        professionalName: 'Pro',
        serviceId: randomUUID(),
        serviceName: 'Serviço',
        price: 50,
        duration,
      },
    ],
  });
}

describe('ListAppointmentsUseCase', () => {
  let repository: InMemoryAppointmentRepository;
  let sut: ListAppointmentsUseCase;
  const proA = randomUUID();
  const proB = randomUUID();

  beforeEach(async () => {
    repository = new InMemoryAppointmentRepository();
    sut = new ListAppointmentsUseCase(repository);

    await repository.save(
      makeAppointment({
        date: '2026-08-10',
        startTime: '09:00',
        professionalId: proA,
      }),
    );
    await repository.save(
      makeAppointment({
        date: '2026-08-12',
        startTime: '14:00',
        professionalId: proB,
      }),
    );
    await repository.save(
      makeAppointment({
        date: '2026-08-20',
        startTime: '10:00',
        professionalId: proA,
      }),
    );
    await repository.save(
      makeAppointment({
        storeId: OTHER_STORE_ID,
        date: '2026-08-10',
        startTime: '11:00',
        professionalId: proA,
      }),
    );
  });

  it('should filter by from/to range', async () => {
    const list = await sut.execute({
      storeId: STORE_ID,
      from: '2026-08-10',
      to: '2026-08-12',
    });
    expect(list).toHaveLength(2);
  });

  it('should filter by professionalId', async () => {
    const list = await sut.execute({
      storeId: STORE_ID,
      from: '2026-08-01',
      to: '2026-08-31',
      professionalId: proA,
    });
    expect(list).toHaveLength(2);
    expect(
      list.every((a) => a.services.some((s) => s.professionalId === proA)),
    ).toBe(true);
  });

  it('should not return appointments from another store', async () => {
    const list = await sut.execute({
      storeId: STORE_ID,
      from: '2026-08-01',
      to: '2026-08-31',
    });
    expect(list).toHaveLength(3);
    expect(list.every((a) => a.storeId === STORE_ID)).toBe(true);
  });

  it('should reject invalid date format', async () => {
    await expect(
      sut.execute({
        storeId: STORE_ID,
        from: '10/08/2026',
        to: '2026-08-12',
      }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });

  it('should reject from after to', async () => {
    await expect(
      sut.execute({
        storeId: STORE_ID,
        from: '2026-08-15',
        to: '2026-08-10',
      }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });
});
