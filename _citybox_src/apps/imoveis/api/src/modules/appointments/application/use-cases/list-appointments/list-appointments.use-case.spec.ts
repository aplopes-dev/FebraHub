import { ListAppointmentsUseCase } from './list-appointments.use-case';
import { InMemoryAppointmentRepository } from '../../../infrastructure/database/in-memory-appointment.repository';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';

const STORE = 'store-1';

async function seed(repo: InMemoryAppointmentRepository) {
  await repo.create({
    storeId: STORE,
    title: 'Minha visita',
    startsAt: new Date('2026-07-29T13:00:00.000Z'),
    endsAt: new Date('2026-07-29T14:00:00.000Z'),
    kind: 'visit',
    agentId: 'carla-mendes',
  });
  await repo.create({
    storeId: STORE,
    title: 'Outra visita',
    startsAt: new Date('2026-07-29T18:00:00.000Z'),
    endsAt: new Date('2026-07-29T19:00:00.000Z'),
    kind: 'follow-up',
    agentId: 'bruno-costa',
  });
  await repo.create({
    storeId: STORE,
    title: 'Fora do range',
    startsAt: new Date('2026-08-05T13:00:00.000Z'),
    endsAt: new Date('2026-08-05T14:00:00.000Z'),
    kind: 'visit',
    agentId: 'carla-mendes',
  });
}

describe('ListAppointmentsUseCase', () => {
  it('lista por intervalo inclusivo from/to', async () => {
    const repo = new InMemoryAppointmentRepository();
    await seed(repo);
    const useCase = new ListAppointmentsUseCase(repo);

    const result = await useCase.execute({
      storeId: STORE,
      from: '2026-07-29',
      to: '2026-07-29',
    });

    expect(result.total).toBe(2);
    expect(result.items.map((i) => i.title)).toEqual([
      'Minha visita',
      'Outra visita',
    ]);
  });

  it('filtra por agentId', async () => {
    const repo = new InMemoryAppointmentRepository();
    await seed(repo);
    const useCase = new ListAppointmentsUseCase(repo);

    const result = await useCase.execute({
      storeId: STORE,
      from: '2026-07-29',
      to: '2026-07-29',
      agentId: 'carla-mendes',
    });

    expect(result.total).toBe(1);
    expect(result.items[0].agentId).toBe('carla-mendes');
  });

  it('filtra por excludeAgentId', async () => {
    const repo = new InMemoryAppointmentRepository();
    await seed(repo);
    const useCase = new ListAppointmentsUseCase(repo);

    const result = await useCase.execute({
      storeId: STORE,
      from: '2026-07-29',
      to: '2026-07-29',
      excludeAgentId: 'carla-mendes',
    });

    expect(result.total).toBe(1);
    expect(result.items[0].agentId).toBe('bruno-costa');
  });

  it('filtra por done', async () => {
    const repo = new InMemoryAppointmentRepository();
    await seed(repo);
    await repo.create({
      storeId: STORE,
      title: 'Visita concluída',
      startsAt: new Date('2026-07-29T11:00:00.000Z'),
      endsAt: new Date('2026-07-29T12:00:00.000Z'),
      kind: 'visit',
      agentId: 'carla-mendes',
      done: true,
    });
    const useCase = new ListAppointmentsUseCase(repo);

    const pending = await useCase.execute({
      storeId: STORE,
      from: '2026-07-29',
      to: '2026-07-29',
      kind: ['visit'],
      done: false,
    });
    expect(pending.total).toBe(1);
    expect(pending.items[0].title).toBe('Minha visita');

    const finished = await useCase.execute({
      storeId: STORE,
      from: '2026-07-29',
      to: '2026-07-29',
      kind: ['visit'],
      done: true,
    });
    expect(finished.total).toBe(1);
    expect(finished.items[0].title).toBe('Visita concluída');
  });

  it('exige from e to', async () => {
    const repo = new InMemoryAppointmentRepository();
    const useCase = new ListAppointmentsUseCase(repo);

    await expect(
      useCase.execute({ storeId: STORE, from: '', to: '2026-07-29' }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });
});
