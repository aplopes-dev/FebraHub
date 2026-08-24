import { HandleGoogleCalendarCallbackUseCase } from './handle-google-calendar-callback.use-case';
import { GoogleCalendarService } from '../../../infrastructure/google-calendar.service';
import { stubPrismaForGoogleCalendar } from '../../../infrastructure/stub-prisma-for-tests';
import { InMemoryAgentProfileRepository } from '../../../../settings/infrastructure/database/in-memory-agent-profile.repository';

describe('HandleGoogleCalendarCallbackUseCase', () => {
  it('redireciona para /calendar com error quando Google recusa', async () => {
    const profiles = new InMemoryAgentProfileRepository();
    const service = new GoogleCalendarService(
      profiles,
      stubPrismaForGoogleCalendar(),
    );
    const useCase = new HandleGoogleCalendarCallbackUseCase(service);

    const result = await useCase.execute({
      code: undefined,
      state: undefined,
      error: 'access_denied',
    });

    expect(result.redirectUrl).toContain('/calendar');
    expect(result.redirectUrl).toContain('connected=error');
    expect(result.redirectUrl).toContain('reason=access_denied');
  });

  it('redireciona com error quando code/state ausentes', async () => {
    const profiles = new InMemoryAgentProfileRepository();
    const service = new GoogleCalendarService(
      profiles,
      stubPrismaForGoogleCalendar(),
    );
    const useCase = new HandleGoogleCalendarCallbackUseCase(service);

    const result = await useCase.execute({
      code: undefined,
      state: undefined,
      error: undefined,
    });

    expect(result.redirectUrl).toContain('/calendar');
    expect(result.redirectUrl).toContain('connected=error');
    expect(result.redirectUrl).toContain('reason=missing_code');
  });
});
