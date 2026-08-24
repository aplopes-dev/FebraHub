import { stubPrismaForGoogleCalendar } from './stub-prisma-for-tests';
import {
  GOOGLE_CALENDAR_EVENTS_SCOPE,
  GoogleCalendarService,
  toGoogleDateTime,
} from './google-calendar.service';
import { InMemoryAgentProfileRepository } from '../../settings/infrastructure/database/in-memory-agent-profile.repository';

describe('GoogleCalendarService helpers', () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    process.env = { ...envBackup };
  });

  it('auth URL inclui scope calendar.events e access_type=offline', () => {
    process.env.GOOGLE_CLIENT_ID = 'client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'client-secret';
    process.env.GOOGLE_REDIRECT_URI =
      'http://localhost:3112/api/v1/users/me/integrations/google-calendar/callback';

    const service = new GoogleCalendarService(
      new InMemoryAgentProfileRepository(),
      stubPrismaForGoogleCalendar(),
    );
    const url = service.buildAuthUrl('store-1', 'agent-1');

    expect(url).toContain('accounts.google.com');
    expect(url).toContain(encodeURIComponent(GOOGLE_CALENDAR_EVENTS_SCOPE));
    expect(url).toContain('access_type=offline');
    expect(url).toContain('prompt=consent');
  });

  it('formata start/end com wall-clock America/Bahia e timeZone', () => {
    // 13:00 Bahia = 16:00 UTC
    const instant = new Date('2026-07-29T16:00:00.000Z');
    const formatted = toGoogleDateTime(instant);

    expect(formatted.timeZone).toBe('America/Bahia');
    expect(formatted.dateTime).toBe('2026-07-29T13:00:00');
  });

  it('carga histórica inclui passados e futuros (sem filtro de data)', async () => {
    process.env.GOOGLE_CLIENT_ID = 'client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'client-secret';
    process.env.GOOGLE_REDIRECT_URI =
      'http://localhost:3112/api/v1/users/me/integrations/google-calendar/callback';

    const findMany = jest.fn().mockResolvedValue([]);
    const count = jest.fn().mockResolvedValue(5);
    const prisma = {
      appointment: {
        findMany,
        count,
        update: jest.fn(),
      },
    } as never;

    const service = new GoogleCalendarService(
      new InMemoryAgentProfileRepository(),
      prisma,
    );
    const synced = await service.syncExistingAppointmentsForAgent(
      'store-1',
      'agent-1',
    );

    expect(synced).toBe(0);
    expect(count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          storeId: 'store-1',
          agentId: 'agent-1',
          googleEventId: null,
        },
      }),
    );
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          storeId: 'store-1',
          agentId: 'agent-1',
          googleEventId: null,
        },
        orderBy: { startsAt: 'asc' },
        take: 200,
      }),
    );
    // Sem filtro de data / startsAt no where.
    expect(findMany.mock.calls[0][0].where.startsAt).toBeUndefined();
  });
});
