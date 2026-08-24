import { Injectable } from '@nestjs/common';
import { AppointmentNotFoundError } from '../../../appointments/domain/errors/appointment-not-found.error';
import { AppointmentRepository } from '../../../appointments/domain/repositories/appointment.repository.interface';
import { DealRepository } from '../../../deals/domain/repositories/deal.repository.interface';
import { LeadNotFoundError } from '../../../leads/domain/errors/lead-not-found.error';
import { LeadEntity } from '../../../leads/domain/entities/lead.entity';
import { LeadRepository } from '../../../leads/domain/repositories/lead.repository.interface';
import { PropertyEntity } from '../../../properties/domain/entities/property.entity';
import { PropertyRepository } from '../../../properties/domain/repositories/property.repository.interface';
import { AgentProfileRepository } from '../../../settings/domain/repositories/agent-profile.repository.interface';
import { StoreSettingsRepository } from '../../../settings/domain/repositories/store-settings.repository.interface';
import { TransactionNotFoundError } from '../../../transactions/domain/errors/transaction-not-found.error';
import { TransactionRepository } from '../../../transactions/domain/repositories/transaction.repository.interface';
import { DocumentTemplateEntity } from '../../domain/entities/document-template.entity';
import { DocumentContextForbiddenError } from '../../domain/errors/document-context-forbidden.error';
import { DocumentTemplateNotFoundError } from '../../domain/errors/document-template-not-found.error';
import { DocumentTemplateRepository } from '../../domain/repositories/document-template.repository.interface';
import { buildMergeSnapshot } from '../policies/build-merge-snapshot';
import type { DocumentMergeSnapshot } from '../policies/document-variable-catalog';
import {
  assertTemplateMatchesContext,
  resolveDocumentContext,
  type DocumentGenerateContext,
} from '../policies/template-context-policy';

export type ResolvedMergeContext = {
  template: DocumentTemplateEntity;
  snapshot: DocumentMergeSnapshot;
  lead: LeadEntity | null;
  property: PropertyEntity | null;
  dealId: string | null;
  appointmentId: string | null;
  transactionId: string | null;
  propertyId: string | null;
};

@Injectable()
export class DocumentMergeContextService {
  constructor(
    private readonly templates: DocumentTemplateRepository,
    private readonly leads: LeadRepository,
    private readonly properties: PropertyRepository,
    private readonly appointments: AppointmentRepository,
    private readonly transactions: TransactionRepository,
    private readonly profiles: AgentProfileRepository,
    private readonly storeSettings: StoreSettingsRepository,
    private readonly deals: DealRepository,
  ) {}

  async resolve(input: {
    storeId: string;
    templateId: string;
    actorAgentId?: string | null;
    context: DocumentGenerateContext;
  }): Promise<ResolvedMergeContext> {
    const template = await this.templates.findById(
      input.storeId,
      input.templateId,
    );
    if (!template || !template.ativo) {
      throw new DocumentTemplateNotFoundError(input.templateId);
    }

    const resolved = resolveDocumentContext(
      DocumentMergeContextService.name,
      input.context,
    );
    assertTemplateMatchesContext(
      DocumentMergeContextService.name,
      template.tipo,
      resolved,
    );

    let lead: LeadEntity | null = null;
    let appointmentId: string | null = null;
    let transactionId: string | null = null;
    let propertyId: string | null = null;

    if (resolved.kind === 'appointment') {
      const appointment = await this.appointments.findById(
        input.storeId,
        resolved.appointmentId!,
      );
      if (!appointment) {
        throw new AppointmentNotFoundError(resolved.appointmentId!);
      }
      if (!appointment.leadId) {
        throw new DocumentContextForbiddenError(
          DocumentMergeContextService.name,
          'Appointment has no lead',
        );
      }
      appointmentId = appointment.id;
      lead = await this.leads.findById(input.storeId, appointment.leadId);
      if (!lead) throw new LeadNotFoundError(appointment.leadId);
      propertyId = appointment.propertyId ?? lead.matchedProperties[0]?.propertyId ?? null;
      const property = propertyId
        ? await this.properties.findById(input.storeId, propertyId)
        : null;
      const snapshot = await this.snapshot({
        storeId: input.storeId,
        actorAgentId: input.actorAgentId ?? appointment.agentId,
        lead,
        property,
        appointment,
        transaction: null,
      });
      const deal = await this.deals.findActiveByLeadId(input.storeId, lead.id);
      return {
        template,
        snapshot,
        lead,
        property,
        dealId: deal?.id ?? null,
        appointmentId,
        transactionId: null,
        propertyId: property?.id ?? propertyId,
      };
    }

    if (resolved.kind === 'transaction') {
      const transaction = await this.transactions.findById(
        input.storeId,
        resolved.transactionId!,
      );
      if (!transaction) {
        throw new TransactionNotFoundError(resolved.transactionId!);
      }
      transactionId = transaction.id;
      if (transaction.leadId) {
        lead = await this.leads.findById(input.storeId, transaction.leadId);
      }
      propertyId = transaction.propertyId;
      const property = propertyId
        ? await this.properties.findById(input.storeId, propertyId)
        : null;
      const snapshot = await this.snapshot({
        storeId: input.storeId,
        actorAgentId: input.actorAgentId ?? transaction.captorId,
        lead,
        property,
        appointment: null,
        transaction,
      });
      return {
        template,
        snapshot,
        lead,
        property,
        dealId: transaction.dealId,
        appointmentId: null,
        transactionId,
        propertyId: property?.id ?? propertyId,
      };
    }

    lead = await this.leads.findById(input.storeId, resolved.leadId!);
    if (!lead) throw new LeadNotFoundError(resolved.leadId!);
    propertyId = lead.matchedProperties[0]?.propertyId ?? null;
    const property = propertyId
      ? await this.properties.findById(input.storeId, propertyId)
      : null;
    const snapshot = await this.snapshot({
      storeId: input.storeId,
      actorAgentId: input.actorAgentId ?? lead.agentId,
      lead,
      property,
      appointment: null,
      transaction: null,
    });
    const deal = await this.deals.findActiveByLeadId(input.storeId, lead.id);
    return {
      template,
      snapshot,
      lead,
      property,
      dealId: deal?.id ?? null,
      appointmentId: null,
      transactionId: null,
      propertyId: property?.id ?? propertyId,
    };
  }

  private async snapshot(input: {
    storeId: string;
    actorAgentId?: string | null;
    lead: LeadEntity | null;
    property: PropertyEntity | null;
    appointment: Awaited<ReturnType<AppointmentRepository['findById']>>;
    transaction: Awaited<ReturnType<TransactionRepository['findById']>>;
  }): Promise<DocumentMergeSnapshot> {
    const [store, agent] = await Promise.all([
      this.storeSettings.findByStoreId(input.storeId),
      input.actorAgentId
        ? this.profiles.findByAgentId(input.storeId, input.actorAgentId)
        : Promise.resolve(null),
    ]);
    return buildMergeSnapshot({
      lead: input.lead,
      property: input.property,
      appointment: input.appointment,
      transaction: input.transaction,
      agent,
      store,
    });
  }
}
