import type { PrismaService } from '../../../shared/infra/prisma/prisma.service';

/** Stub Prisma para unit tests do GoogleCalendarService (backfill não exercitado). */
export function stubPrismaForGoogleCalendar(): PrismaService {
  return {
    appointment: {
      findMany: async () => [],
      update: async () => null,
    },
  } as unknown as PrismaService;
}
