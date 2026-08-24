import { CreateAppointmentUseCase } from './create-appointment.use-case';
import { InMemoryAppointmentRepository } from '../../../infrastructure/database/in-memory-appointment.repository';
import { InvalidAppointmentIntervalError } from '../../../domain/errors/invalid-appointment-interval.error';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { GoogleCalendarService } from '../../../../google-calendar/infrastructure/google-calendar.service';
import { stubPrismaForGoogleCalendar } from '../../../../google-calendar/infrastructure/stub-prisma-for-tests';
import { InMemoryAgentProfileRepository } from '../../../../settings/infrastructure/database/in-memory-agent-profile.repository';

const STORE = 'store-1';

const validInput = {
  storeId: STORE,
  title: 'Visita Residencial Aurora',
  description: 'Cliente interessado',
  startsAt: '2026-07-29T13:00:00.000-03:00',
  endsAt: '2026-07-29T14:00:00.000-03:00',
  location: 'Rua das Palmeiras, 100',
  kind: 'visit' as const,
  agentId: 'carla-mendes',
  leadId: 'lead-1',
  leadName: 'Ana Silva',
  leadEmail: 'ana@example.com',
  leadPhone: '73999990000',
  leadPhotoUrl: null,
  propertyId: null,
};

function buildUseCase(repo = new InMemoryAppointmentRepository()) {
  const profiles = new InMemoryAgentProfileRepository();
  const google = new GoogleCalendarService(
    profiles,
    stubPrismaForGoogleCalendar(),
  );
  return {
    repo,
    useCase: new CreateAppointmentUseCase(repo, google),
  };
}

describe('CreateAppointmentUseCase', () => {
  it('cria compromisso com snapshot de lead', async () => {
    const { useCase } = buildUseCase();

    const result = await useCase.execute(validInput);

    expect(result.title).toBe('Visita Residencial Aurora');
    expect(result.kind).toBe('visit');
    expect(result.agentId).toBe('carla-mendes');
    expect(result.leadName).toBe('Ana Silva');
    expect(result.done).toBe(false);
  });

  it('rejeita intervalo inválido', async () => {
    const { useCase } = buildUseCase();

    await expect(
      useCase.execute({
        ...validInput,
        startsAt: '2026-07-29T14:00:00.000-03:00',
        endsAt: '2026-07-29T13:00:00.000-03:00',
      }),
    ).rejects.toBeInstanceOf(InvalidAppointmentIntervalError);
  });

  it('rejeita título vazio', async () => {
    const { useCase } = buildUseCase();

    await expect(
      useCase.execute({ ...validInput, title: '  ' }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });
});
