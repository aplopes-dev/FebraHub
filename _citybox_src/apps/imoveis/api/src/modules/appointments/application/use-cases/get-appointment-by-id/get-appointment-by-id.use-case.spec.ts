import { GetAppointmentByIdUseCase } from './get-appointment-by-id.use-case';
import { InMemoryAppointmentRepository } from '../../../infrastructure/database/in-memory-appointment.repository';
import { AppointmentNotFoundError } from '../../../domain/errors/appointment-not-found.error';

const STORE = 'store-1';

describe('GetAppointmentByIdUseCase', () => {
  it('retorna compromisso existente', async () => {
    const repo = new InMemoryAppointmentRepository();
    const created = await repo.create({
      storeId: STORE,
      title: 'Visita',
      startsAt: new Date('2026-07-29T13:00:00.000Z'),
      endsAt: new Date('2026-07-29T14:00:00.000Z'),
      kind: 'visit',
      agentId: 'carla-mendes',
    });

    const result = await new GetAppointmentByIdUseCase(repo).execute({
      storeId: STORE,
      id: created.id,
    });

    expect(result.id).toBe(created.id);
  });

  it('lança AppointmentNotFoundError', async () => {
    const repo = new InMemoryAppointmentRepository();
    await expect(
      new GetAppointmentByIdUseCase(repo).execute({
        storeId: STORE,
        id: 'missing',
      }),
    ).rejects.toBeInstanceOf(AppointmentNotFoundError);
  });
});
