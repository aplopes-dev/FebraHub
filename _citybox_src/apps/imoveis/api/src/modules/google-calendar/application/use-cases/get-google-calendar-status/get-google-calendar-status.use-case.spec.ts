import { GetGoogleCalendarStatusUseCase } from './get-google-calendar-status.use-case';
import { GoogleCalendarService } from '../../../infrastructure/google-calendar.service';
import { stubPrismaForGoogleCalendar } from '../../../infrastructure/stub-prisma-for-tests';
import { InMemoryAgentProfileRepository } from '../../../../settings/infrastructure/database/in-memory-agent-profile.repository';

describe('GetGoogleCalendarStatusUseCase', () => {
  it('retorna desconectado quando perfil vazio', async () => {
    const profiles = new InMemoryAgentProfileRepository();
    const service = new GoogleCalendarService(
      profiles,
      stubPrismaForGoogleCalendar(),
    );
    const useCase = new GetGoogleCalendarStatusUseCase(profiles, service);

    const status = await useCase.execute({
      storeId: 'store-1',
      agentId: 'agent-1',
    });

    expect(status.connected).toBe(false);
    expect(status.enabled).toBe(false);
    expect(status.calendarId).toBe('primary');
  });

  it('retorna conectado quando há refresh token', async () => {
    const profiles = new InMemoryAgentProfileRepository();
    await profiles.setGoogleCalendarCredentials('store-1', 'agent-1', {
      googleCalendarEnabled: true,
      googleRefreshToken: 'refresh-token',
      googleCalendarId: 'primary',
    });
    const service = new GoogleCalendarService(
      profiles,
      stubPrismaForGoogleCalendar(),
    );
    const useCase = new GetGoogleCalendarStatusUseCase(profiles, service);

    const status = await useCase.execute({
      storeId: 'store-1',
      agentId: 'agent-1',
    });

    expect(status.connected).toBe(true);
    expect(status.enabled).toBe(true);
  });
});
