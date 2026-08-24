import { UpdateAppointmentUseCase } from './update-appointment.use-case';
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

describe('UpdateAppointmentUseCase', () => {
  it('atualiza título e done preservando snapshot', async () => {
    const repo = new InMemoryAppointmentRepository();
    const gcal = google();
    const created = await new CreateAppointmentUseCase(repo, gcal).execute({
      storeId: STORE,
      title: 'Visita',
      startsAt: '2026-07-29T10:00:00.000-03:00',
      endsAt: '2026-07-29T11:00:00.000-03:00',
      kind: 'visit',
      agentId: 'carla-mendes',
      leadId: 'lead-1',
      leadName: 'Ana',
    });

    const updated = await new UpdateAppointmentUseCase(repo, gcal).execute({
      storeId: STORE,
      id: created.id,
      title: 'Visita atualizada',
      startsAt: '2026-07-29T10:00:00.000-03:00',
      endsAt: '2026-07-29T11:30:00.000-03:00',
      kind: 'visit',
      agentId: 'carla-mendes',
      done: true,
      leadId: 'lead-1',
      leadName: 'Ana',
    });

    expect(updated.title).toBe('Visita atualizada');
    expect(updated.done).toBe(true);
    expect(updated.leadName).toBe('Ana');
  });

  it('lança AppointmentNotFoundError', async () => {
    const repo = new InMemoryAppointmentRepository();
    await expect(
      new UpdateAppointmentUseCase(repo, google()).execute({
        storeId: STORE,
        id: 'missing',
        title: 'X',
        startsAt: '2026-07-29T10:00:00.000-03:00',
        endsAt: '2026-07-29T11:00:00.000-03:00',
        kind: 'visit',
        agentId: 'carla-mendes',
      }),
    ).rejects.toBeInstanceOf(AppointmentNotFoundError);
  });
});
