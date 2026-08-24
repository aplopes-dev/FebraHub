import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { SyncActiveDealForLeadUseCase } from '../../../../deals/application/use-cases/sync-active-deal-for-lead/sync-active-deal-for-lead.use-case';
import type { LeadEntity } from '../../../domain/entities/lead.entity';
import { LeadDocumentFileUnavailableError } from '../../../domain/errors/lead-document-file-unavailable.error';
import { LeadDocumentNotFoundError } from '../../../domain/errors/lead-document-not-found.error';
import { LeadNotFoundError } from '../../../domain/errors/lead-not-found.error';
import { LeadRepository } from '../../../domain/repositories/lead.repository.interface';
import {
  createLeadDocumentShareToken,
  leadDocumentShareExpiresAt,
  publicLeadDocumentShareUrl,
} from '../../policies/document-share.policy';
import {
  buildLeadDocumentWhatsAppMessage,
  phoneDigits,
  whatsAppHref,
} from '../../policies/whatsapp-href.policy';

export type SendLeadDocumentWhatsAppInput = {
  storeId: string;
  leadId: string;
  documentId: string;
  now?: Date;
};

export type SendLeadDocumentWhatsAppResult = {
  lead: LeadEntity;
  shareUrl: string;
  whatsappUrl: string;
  sentAt: Date;
};

@Injectable()
export class SendLeadDocumentWhatsAppUseCase implements IUseCase<
  SendLeadDocumentWhatsAppInput,
  SendLeadDocumentWhatsAppResult
> {
  constructor(
    private readonly leads: LeadRepository,
    private readonly syncActiveDeal: SyncActiveDealForLeadUseCase,
  ) {}

  async execute(
    input: SendLeadDocumentWhatsAppInput,
  ): Promise<SendLeadDocumentWhatsAppResult> {
    const lead = await this.leads.findById(input.storeId, input.leadId);
    if (!lead) throw new LeadNotFoundError(input.leadId);

    const document = await this.leads.findDocument(
      input.storeId,
      input.leadId,
      input.documentId,
    );
    if (!document) throw new LeadDocumentNotFoundError(input.documentId);
    if (!document.objectKey) {
      throw new LeadDocumentFileUnavailableError(
        SendLeadDocumentWhatsAppUseCase.name,
        input.documentId,
      );
    }

    const phone = lead.phone.trim();
    if (!phoneDigits(phone)) {
      throw new ValidatorDomainError({
        internalMessage: `Lead ${input.leadId} has no phone for WhatsApp send`,
        externalMessage: 'Cadastre o telefone do lead para enviar por WhatsApp.',
        context: SendLeadDocumentWhatsAppUseCase.name,
      });
    }

    const now = input.now ?? new Date();
    const shareToken = createLeadDocumentShareToken();
    const shareExpiresAt = leadDocumentShareExpiresAt(now);
    const shareUrl = publicLeadDocumentShareUrl(shareToken);
    const message = buildLeadDocumentWhatsAppMessage(
      lead.name,
      document.name,
      shareUrl,
    );
    const kindLabel =
      document.kind === 'contract' ? 'Contrato' : 'Documento';

    const updated = await this.leads.markDocumentSent(
      input.storeId,
      input.leadId,
      input.documentId,
      {
        sentAt: now,
        sentChannel: 'whatsapp',
        shareToken,
        shareExpiresAt,
        activityMessage: `${kindLabel} enviado por WhatsApp: ${document.name}`,
      },
    );
    if (!updated) throw new LeadNotFoundError(input.leadId);

    await this.syncActiveDeal.execute(updated);

    return {
      lead: updated,
      shareUrl,
      whatsappUrl: whatsAppHref(phone, message),
      sentAt: now,
    };
  }
}
