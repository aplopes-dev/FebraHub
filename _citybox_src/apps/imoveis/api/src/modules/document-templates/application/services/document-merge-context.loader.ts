import { Injectable } from '@nestjs/common';
import { AppointmentNotFoundError } from '../../../appointments/domain/errors/appointment-not-found.error';
import { AppointmentRepository } from '../../../appointments/domain/repositories/appointment.repository.interface';
import { DealRepository } from '../../../deals/domain/repositories/deal.repository.interface';
import { LeadNotFoundError } from '../../../leads/domain/errors/lead-not-found.error';
import { LeadRepository } from '../../../leads/domain/repositories/lead.repository.interface';
import { PropertyRepository } from '../../../properties/domain/repositories/property.repository.interface';
import { AgentProfileRepository } from '../../../settings/domain/repositories/agent-profile.repository.interface';
import { StoreSettingsRepository } from '../../../settings/domain/repositories/store-settings.repository.interface';
import { TransactionNotFoundError } from '../../../transactions/domain/errors/transaction-not-found.error';
import { TransactionRepository } from '../../../transactions/domain/repositories/transaction.repository.interface';
import { DocumentContextForbiddenError } from '../../domain/errors/document-context-forbidden.error';
import { buildMergeSnapshot } from '../policies/build-merge-snapshot';
import type { DocumentMergeSnapshot } from '../policies/document-variable-catalog';
import type { ResolvedDocumentContextIds } from '../policies/document-context.policy';

export type LoadedDocumentContext = {
  snapshot: DocumentMergeSnapshot;
  leadId: string | null;
  dealId: string | null;
  propertyId: string | null;
  appointmentId: string | null;
  transactionId: string | null;
  resourceAgentId: string | null;
  resourceAgentIds: readonly string[] | null;
};

@Injectable()
export class DocumentMergeContextLoader {
  constructor(
    private readonly leads: LeadRepository,
    private readonly properties: PropertyRepository,
    private readonly appointments: AppointmentRepository,
    private readonly transactions: TransactionRepository,
    private readonly profiles: AgentProfileRepository,
    private readonly settings: StoreSettingsRepository,
    private readonly deals: DealRepository,
  ) {}

  async load(
    storeId: string,
    resolved: ResolvedDocumentContextIds,
    actorAgentId?: string,
  ): Promise<LoadedDocumentContext> {
    const store = await this.settings.findByStoreId(storeId);

    if (resolved.kind === 'lead') {
      const lead = await this.leads.findById(storeId, resolved.leadId!);
      if (!lead) throw new LeadNotFoundError(resolved.leadId!);
      const propertyId = lead.matchedProperties[0]?.propertyId ?? null;
      const property = propertyId
        ? await this.properties.findById(storeId, propertyId)
        : null;
      const deal = await this.deals.findActiveByLeadId(storeId, lead.id);
      const agentId = lead.agentId ?? actorAgentId ?? null;
      const agent = agentId
        ? await this.profiles.findByAgentId(storeId, agentId)
        : null;
      return {
        snapshot: buildMergeSnapshot({ lead, property, agent, store }),
        leadId: lead.id,
        dealId: deal?.id ?? null,
        propertyId,
        appointmentId: null,
        transactionId: null,
        resourceAgentId: lead.agentId,
        resourceAgentIds: lead.agentIds,
      };
    }

    if (resolved.kind === 'appointment') {
      const appointment = await this.appointments.findById(
        storeId,
        resolved.appointmentId!,
      );
      if (!appointment) {
        throw new AppointmentNotFoundError(resolved.appointmentId!);
      }
      if (!appointment.leadId) {
        throw new DocumentContextForbiddenError(
          DocumentMergeContextLoader.name,
          'Appointment has no leadId',
        );
      }
      const lead = await this.leads.findById(storeId, appointment.leadId);
      if (!lead) throw new LeadNotFoundError(appointment.leadId);
      const propertyId =
        appointment.propertyId ?? lead.matchedProperties[0]?.propertyId ?? null;
      const property = propertyId
        ? await this.properties.findById(storeId, propertyId)
        : null;
      const deal = await this.deals.findActiveByLeadId(storeId, lead.id);
      const agentId = appointment.agentId || lead.agentId || actorAgentId || null;
      const agent = agentId
        ? await this.profiles.findByAgentId(storeId, agentId)
        : null;
      return {
        snapshot: buildMergeSnapshot({
          lead,
          property,
          appointment,
          agent,
          store,
        }),
        leadId: lead.id,
        dealId: deal?.id ?? null,
        propertyId,
        appointmentId: appointment.id,
        transactionId: null,
        resourceAgentId: appointment.agentId,
        resourceAgentIds: lead.agentIds,
      };
    }

    const transaction = await this.transactions.findById(
      storeId,
      resolved.transactionId!,
    );
    if (!transaction) {
      throw new TransactionNotFoundError(resolved.transactionId!);
    }
    const lead = transaction.leadId
      ? await this.leads.findById(storeId, transaction.leadId)
      : null;
    const property = transaction.propertyId
      ? await this.properties.findById(storeId, transaction.propertyId)
      : null;
    const deal = transaction.dealId
      ? await this.deals.findById(storeId, transaction.dealId)
      : lead
        ? await this.deals.findActiveByLeadId(storeId, lead.id)
        : null;
    const agentId =
      transaction.captorId || lead?.agentId || actorAgentId || null;
    const agent = agentId
      ? await this.profiles.findByAgentId(storeId, agentId)
      : null;
    const agentIds = [
      transaction.captorId,
      transaction.sellerId,
      ...(lead?.agentIds ?? []),
    ].filter((id): id is string => Boolean(id));
    return {
      snapshot: buildMergeSnapshot({
        lead,
        property,
        transaction,
        agent,
        store,
      }),
      leadId: lead?.id ?? null,
      dealId: deal?.id ?? null,
      propertyId: property?.id ?? transaction.propertyId,
      appointmentId: null,
      transactionId: transaction.id,
      resourceAgentId: transaction.captorId,
      resourceAgentIds: agentIds,
    };
  }
}
