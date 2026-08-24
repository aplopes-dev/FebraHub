import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { AppointmentRepository } from '../../../../appointments/domain/repositories/appointment.repository.interface';
import { LeadEntity } from '../../../domain/entities/lead.entity';
import { LeadRepository } from '../../../domain/repositories/lead.repository.interface';
import type {
  ApiLeadPaymentIntent,
  ApiLeadPurpose,
  ApiLeadSource,
  ApiLeadStatus,
  ApiPropertyType,
} from '../../../domain/mappers/lead-enum.mapper';
import { GoogleCalendarService } from '../../../../google-calendar/infrastructure/google-calendar.service';
import { syncLeadFollowUpAppointment } from '../../policies/sync-lead-follow-up-appointment';
import { SyncActiveDealForLeadUseCase } from '../../../../deals/application/use-cases/sync-active-deal-for-lead/sync-active-deal-for-lead.use-case';

export type CreateLeadInput = {
  storeId: string;
  name: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  status: ApiLeadStatus;
  leadSource: ApiLeadSource;
  interestedPropertyType: ApiPropertyType;
  budgetRange?: string;
  preferredLocation?: string;
  purpose: ApiLeadPurpose;
  paymentIntents?: ApiLeadPaymentIntent[];
  latestFollowUp?: string | null;
  nextFollowUp?: string | null;
  notes?: string;
  photoUrl?: string | null;
  propertyName?: string | null;
  hasSuggestion?: boolean;
  agentId?: string | null;
  agentIds?: string[];
  matchedProperties?: { id: string; name: string }[];
  documents?: {
    id?: string;
    name: string;
    sizeLabel: string;
    kind?: 'contract' | 'other';
    addedAt: string;
  }[];
  activities?: {
    id?: string;
    type: string;
    message: string;
    authorName?: string;
    createdAt?: string;
  }[];
};

@Injectable()
export class CreateLeadUseCase implements IUseCase<
  CreateLeadInput,
  LeadEntity
> {
  constructor(
    private readonly leads: LeadRepository,
    private readonly appointments: AppointmentRepository,
    private readonly syncActiveDeal: SyncActiveDealForLeadUseCase,
    private readonly googleCalendar: GoogleCalendarService,
  ) {}

  async execute(input: CreateLeadInput): Promise<LeadEntity> {
    const { storeId, ...payload } = input;
    const lead = await this.leads.create({ storeId, ...payload });
    await syncLeadFollowUpAppointment(
      this.appointments,
      lead,
      this.googleCalendar,
    );
    await this.syncActiveDeal.execute(lead);
    return lead;
  }
}
