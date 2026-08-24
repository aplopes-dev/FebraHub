import { InMemoryAppointmentRepository } from '../../../../appointments/infrastructure/database/in-memory-appointment.repository';
import { SyncActiveDealForLeadUseCase } from '../../../../deals/application/use-cases/sync-active-deal-for-lead/sync-active-deal-for-lead.use-case';
import { InMemoryDealRepository } from '../../../../deals/infrastructure/database/in-memory-deal.repository';
import { GoogleCalendarService } from '../../../../google-calendar/infrastructure/google-calendar.service';
import { stubPrismaForGoogleCalendar } from '../../../../google-calendar/infrastructure/stub-prisma-for-tests';
import { InMemoryPropertyRepository } from '../../../../properties/infrastructure/database/in-memory-property.repository';
import { InMemoryAgentProfileRepository } from '../../../../settings/infrastructure/database/in-memory-agent-profile.repository';
import { InMemoryTransactionRepository } from '../../../../transactions/infrastructure/database/in-memory-transaction.repository';
import { InMemoryLeadRepository } from '../../../infrastructure/database/in-memory-lead.repository';
import { CreateLeadUseCase } from '../create-lead/create-lead.use-case';
import { UpdateLeadUseCase } from '../update-lead/update-lead.use-case';

function stubGoogleCalendar(): GoogleCalendarService {
  return new GoogleCalendarService(
    new InMemoryAgentProfileRepository(),
    stubPrismaForGoogleCalendar(),
  );
}

function makeSyncActiveDeal(deals: InMemoryDealRepository) {
  return new SyncActiveDealForLeadUseCase(
    deals,
    new InMemoryPropertyRepository(),
    new InMemoryTransactionRepository(),
  );
}

export function makeCreateLeadUseCase(
  leads: InMemoryLeadRepository,
  appointments = new InMemoryAppointmentRepository(),
  deals = new InMemoryDealRepository(),
  googleCalendar = stubGoogleCalendar(),
): CreateLeadUseCase {
  return new CreateLeadUseCase(
    leads,
    appointments,
    makeSyncActiveDeal(deals),
    googleCalendar,
  );
}

export function makeUpdateLeadUseCase(
  leads: InMemoryLeadRepository,
  appointments = new InMemoryAppointmentRepository(),
  deals = new InMemoryDealRepository(),
  googleCalendar = stubGoogleCalendar(),
): UpdateLeadUseCase {
  return new UpdateLeadUseCase(
    leads,
    appointments,
    makeSyncActiveDeal(deals),
    googleCalendar,
  );
}
