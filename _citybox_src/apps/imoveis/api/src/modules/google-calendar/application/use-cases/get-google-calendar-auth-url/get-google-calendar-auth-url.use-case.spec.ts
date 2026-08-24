import { GetGoogleCalendarAuthUrlUseCase } from './get-google-calendar-auth-url.use-case';
import { GoogleCalendarService } from '../../../infrastructure/google-calendar.service';
import { stubPrismaForGoogleCalendar } from '../../../infrastructure/stub-prisma-for-tests';
import { InMemoryAgentProfileRepository } from '../../../../settings/infrastructure/database/in-memory-agent-profile.repository';
import { GoogleCalendarNotConfiguredError } from '../../../domain/errors/google-calendar-not-configured.error';

describe('GetGoogleCalendarAuthUrlUseCase', () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    process.env = { ...envBackup };
  });

  it('gera URL quando Google está configurado', async () => {
    process.env.GOOGLE_CLIENT_ID = 'client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'client-secret';
    process.env.GOOGLE_REDIRECT_URI =
      'http://localhost:3112/api/v1/users/me/integrations/google-calendar/callback';

    const profiles = new InMemoryAgentProfileRepository();
    const service = new GoogleCalendarService(
      profiles,
      stubPrismaForGoogleCalendar(),
    );
    const useCase = new GetGoogleCalendarAuthUrlUseCase(service);

    const result = await useCase.execute({
      storeId: 'store-1',
      agentId: 'agent-1',
    });

    expect(result.configured).toBe(true);
    expect(result.url).toContain('accounts.google.com');
    expect(result.url).toContain('access_type=offline');
    expect(result.url).toContain(
      encodeURIComponent('https://www.googleapis.com/auth/calendar.events'),
    );
  });

  it('falha se env faltando', async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GOOGLE_REDIRECT_URI;

    const profiles = new InMemoryAgentProfileRepository();
    const service = new GoogleCalendarService(
      profiles,
      stubPrismaForGoogleCalendar(),
    );
    const useCase = new GetGoogleCalendarAuthUrlUseCase(service);

    await expect(
      useCase.execute({ storeId: 'store-1', agentId: 'agent-1' }),
    ).rejects.toBeInstanceOf(GoogleCalendarNotConfiguredError);
  });
});
