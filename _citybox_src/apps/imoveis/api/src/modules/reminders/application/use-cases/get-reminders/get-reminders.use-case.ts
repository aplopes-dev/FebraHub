import { Injectable, Logger } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { AppointmentRepository } from '../../../../appointments/domain/repositories/appointment.repository.interface';
import { LeadRepository } from '../../../../leads/domain/repositories/lead.repository.interface';
import type { ApiLeadStatus } from '../../../../leads/domain/mappers/lead-enum.mapper';
import {
  civilDayEndExclusiveInBahia,
  civilDayStartInBahia,
  instantToCivilDate,
  todayDateOnly,
} from '../../../../transactions/application/policies/transaction-date.policy';
import { DealRepository } from '../../../../deals/domain/repositories/deal.repository.interface';
import { StoreSettingsRepository } from '../../../../settings/domain/repositories/store-settings.repository.interface';
import {
  buildReminders,
  INBOUND_NEW_LEAD_CAP,
  INBOUND_NEW_LEAD_WINDOW_DAYS,
  REMINDER_AVATARS,
  type Reminder,
} from '../../policies/build-reminders';
import { buildDocumentReminders } from '../../policies/document-reminders.policy';

export type GetRemindersInput = {
  storeId: string;
  agentId?: string;
  /** Override do “agora” — só testes. */
  now?: Date;
};

export type GetRemindersResult = {
  reminders: Reminder[];
};

const OPEN_LEAD_STATUSES: readonly ApiLeadStatus[] = [
  'new',
  'negotiating',
  'scheduled-visit',
];

const APPOINTMENT_WINDOW_DAYS = 6;

function addDaysIso(iso: string, days: number): string {
  const start = civilDayStartInBahia(iso, 'from');
  const next = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
  return instantToCivilDate(next);
}

function startOfInboundWindow(now: Date): Date {
  return new Date(
    now.getTime() - INBOUND_NEW_LEAD_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );
}

@Injectable()
export class GetRemindersUseCase implements IUseCase<
  GetRemindersInput,
  GetRemindersResult
> {
  private readonly logger = new Logger(GetRemindersUseCase.name);

  constructor(
    private readonly leads: LeadRepository,
    private readonly appointments: AppointmentRepository,
    private readonly deals: DealRepository,
    private readonly storeSettings: StoreSettingsRepository,
  ) {}

  async execute(input: GetRemindersInput): Promise<GetRemindersResult> {
    const now = input.now ?? new Date();
    const today = todayDateOnly(now);
    const followUpUntil = new Date(`${today}T00:00:00.000Z`);

    const [followUpLeads, upcomingAppointments, inboundNewLeads] =
      await Promise.all([
        this.leads.findMany(input.storeId, {
          page: 1,
          perPage: REMINDER_AVATARS,
          status: [...OPEN_LEAD_STATUSES],
          followUpUntil,
          agentId: input.agentId,
        }),
        this.appointments.findMany(input.storeId, {
          page: 1,
          perPage: 200,
          from: civilDayStartInBahia(today, 'from'),
          toExclusive: civilDayEndExclusiveInBahia(
            addDaysIso(today, APPOINTMENT_WINDOW_DAYS),
            'to',
          ),
          done: false,
          agentId: input.agentId,
        }),
        this.leads.findMany(input.storeId, {
          page: 1,
          perPage: INBOUND_NEW_LEAD_CAP,
          status: ['new'],
          leadSource: ['website', 'whatsapp'],
          createdAtFrom: startOfInboundWindow(now),
          agentId: input.agentId,
        }),
      ]);

    const documentReminders = await this.loadDocumentReminders(
      input.storeId,
      input.agentId,
      now,
    );

    return {
      reminders: buildReminders(
        followUpLeads,
        upcomingAppointments.items,
        inboundNewLeads.items,
        documentReminders,
      ),
    };
  }

  private async loadDocumentReminders(
    storeId: string,
    agentId: string | undefined,
    now: Date,
  ): Promise<Reminder[]> {
    try {
      const settings = await this.storeSettings.findByStoreId(storeId);
      if (settings?.notifications.documentsAlerts !== true) return [];

      const [documentLeads, activeDeals] = await Promise.all([
        this.leads.findMany(storeId, {
          page: 1,
          perPage: 50,
          status: [...OPEN_LEAD_STATUSES],
          agentId,
        }),
        this.deals.findMany(storeId, {
          page: 1,
          perPage: 100,
          status: ['active'],
        }),
      ]);
      const stageByLeadId = new Map(
        activeDeals.items.map((deal) => [deal.leadId, deal.stage] as const),
      );
      return buildDocumentReminders(documentLeads.items, stageByLeadId, now);
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown_error';
      this.logger.error(
        `document_reminders_skipped storeId=${storeId} reason=${reason}`,
      );
      return [];
    }
  }
}
