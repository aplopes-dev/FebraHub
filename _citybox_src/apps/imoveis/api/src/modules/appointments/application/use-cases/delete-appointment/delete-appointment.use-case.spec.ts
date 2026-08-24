import { DeleteAppointmentUseCase } from './delete-appointment.use-case';
import { CreateAppointmentUseCase } from '../create-appointment/create-appointment.use-case';
import { InMemoryAppointmentRepository } from '../../../infrastructure/database/in-memory-appointment.repository';
import { AppointmentNotFoundError } from '../../../domain/errors/appointment-not-found.error';
import { GoogleCalendarService } from '../../../../google-calendar/infrastructure/google-calendar.service';
import { stubPrismaForGoogleCalendar } from '../../../../google-calendar/infrastructure/stub-prisma-for-tests';
import { InMemoryAgentProfileRepository } from '../../../../settings/infrastructure/database/in-memory-agent-profile.repository';

const STORE = 'store-1';

function google() {
  return new GoogleCalendarService(
    new InMemoryAgentProfileRepository(),
    stubPrismaForGoogleCalendar(),
  );
}

describe('DeleteAppointmentUseCase', () => {
  it('remove compromisso existente', async () => {
    const repo = new InMemoryAppointmentRepository();
    const gcal = google();
    const created = await new CreateAppointmentUseCase(repo, gcal).execute({
      storeId: STORE,
      title: 'Visita',
      startsAt: '2026-07-29T10:00:00.000-03:00',
      endsAt: '2026-07-29T11:00:00.000-03:00',
      kind: 'visit',
      agentId: 'carla-mendes',
    });

    await new DeleteAppointmentUseCase(repo, gcal).execute({
      storeId: STORE,
      id: created.id,
    });

    expect(await repo.findById(STORE, created.id)).toBeNull();
  });

  it('lança AppointmentNotFoundError', async () => {
    const repo = new InMemoryAppointmentRepository();
    await expect(
      new DeleteAppointmentUseCase(repo, google()).execute({
        storeId: STORE,
        id: 'missing',
      }),
    ).rejects.toBeInstanceOf(AppointmentNotFoundError);
  });
});
