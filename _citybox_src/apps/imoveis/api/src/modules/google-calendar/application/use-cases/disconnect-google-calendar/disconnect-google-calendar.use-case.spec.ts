import { DisconnectGoogleCalendarUseCase } from './disconnect-google-calendar.use-case';
import { GoogleCalendarService } from '../../../infrastructure/google-calendar.service';
import { stubPrismaForGoogleCalendar } from '../../../infrastructure/stub-prisma-for-tests';
import { InMemoryAgentProfileRepository } from '../../../../settings/infrastructure/database/in-memory-agent-profile.repository';

describe('DisconnectGoogleCalendarUseCase', () => {
  it('limpa token e desativa sync', async () => {
    const profiles = new InMemoryAgentProfileRepository();
    await profiles.setGoogleCalendarCredentials('store-1', 'agent-1', {
      googleCalendarEnabled: true,
      googleRefreshToken: 'refresh-token',
    });
    const service = new GoogleCalendarService(
      profiles,
      stubPrismaForGoogleCalendar(),
    );
    const useCase = new DisconnectGoogleCalendarUseCase(service);

    await useCase.execute({ storeId: 'store-1', agentId: 'agent-1' });

    const profile = await profiles.findByAgentId('store-1', 'agent-1');
    expect(profile?.googleRefreshToken).toBeNull();
    expect(profile?.googleCalendarEnabled).toBe(false);
    expect(profile?.googleCalendarConnected).toBe(false);
  });
});
