import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { SyncActiveDealForLeadUseCase } from '../../../../deals/application/use-cases/sync-active-deal-for-lead/sync-active-deal-for-lead.use-case';
import { ImoveisObjectKeyPolicy } from '../../../../properties/application/policies/imoveis-object-key.policy';
import { formatFileSizeLabel } from '../../../../settings/application/policies/file-size-label';
import { LeadRepository } from '../../../../leads/domain/repositories/lead.repository.interface';
import { DocumentPdfRenderer } from '../../../domain/pdf/document-pdf-renderer';
import { DocumentTemplateNotFoundError } from '../../../domain/errors/document-template-not-found.error';
import { GeneratedDocumentEntity } from '../../../domain/entities/generated-document.entity';
import { DocumentTemplateRepository } from '../../../domain/repositories/document-template.repository.interface';
import { GeneratedDocumentRepository } from '../../../domain/repositories/generated-document.repository.interface';
import {
  assertTemplateMatchesContext,
  defaultLeadDocumentKind,
  resolveDocumentContextIds,
} from '../../policies/document-context.policy';
import { interpolateTemplate } from '../../policies/interpolate-template';
import { DocumentMergeContextLoader } from '../../services/document-merge-context.loader';

export type GenerateDocumentInput = {
  storeId: string;
  templateId: string;
  leadId?: string;
  appointmentId?: string;
  transactionId?: string;
  kind?: 'contract' | 'other';
  actorAgentId?: string;
};

export type GenerateDocumentResult = {
  document: GeneratedDocumentEntity;
  leadDocumentId: string | null;
};

const PDF_MIME = 'application/pdf';

@Injectable()
export class GenerateDocumentUseCase implements IUseCase<
  GenerateDocumentInput,
  GenerateDocumentResult
> {
  constructor(
    private readonly templates: DocumentTemplateRepository,
    private readonly generated: GeneratedDocumentRepository,
    private readonly loader: DocumentMergeContextLoader,
    private readonly pdf: DocumentPdfRenderer,
    private readonly storage: ObjectStorage,
    private readonly leads: LeadRepository,
    private readonly syncActiveDeal: SyncActiveDealForLeadUseCase,
  ) {}

  async execute(input: GenerateDocumentInput): Promise<GenerateDocumentResult> {
    const template = await this.templates.findById(
      input.storeId,
      input.templateId,
    );
    if (!template) throw new DocumentTemplateNotFoundError(input.templateId);
    const resolved = resolveDocumentContextIds(
      input,
      GenerateDocumentUseCase.name,
    );
    assertTemplateMatchesContext(
      template.tipo,
      resolved.kind,
      GenerateDocumentUseCase.name,
    );
    const loaded = await this.loader.load(
      input.storeId,
      resolved,
      input.actorAgentId,
    );
    const html = interpolateTemplate(template.conteudoHtml, loaded.snapshot);
    const generatedId = randomUUID();
    const objectKey = loaded.leadId
      ? ImoveisObjectKeyPolicy.leadDocumentKey(
          input.storeId,
          loaded.leadId,
          generatedId,
          PDF_MIME,
        )
      : ImoveisObjectKeyPolicy.generatedDocumentKey(
          input.storeId,
          generatedId,
          PDF_MIME,
        );
    const buffer = await this.pdf.render(html, template.nome);
    await this.storage.put({
      key: objectKey,
      buffer,
      mimeType: PDF_MIME,
    });

    const document = await this.generated.create({
      id: generatedId,
      storeId: input.storeId,
      templateId: template.id,
      titulo: template.nome,
      conteudoRender: html,
      dadosSnapshot: loaded.snapshot,
      objectKey,
      mimeType: PDF_MIME,
      status: 'gerado',
      leadId: loaded.leadId,
      dealId: loaded.dealId,
      propertyId: loaded.propertyId,
      appointmentId: loaded.appointmentId,
      transactionId: loaded.transactionId,
    });

    if (!loaded.leadId) {
      return { document, leadDocumentId: null };
    }

    const kind = input.kind ?? defaultLeadDocumentKind(template.tipo);
    const updated = await this.leads.addDocument(input.storeId, loaded.leadId, {
      id: generatedId,
      name: `${template.nome}.pdf`,
      sizeLabel: formatFileSizeLabel(buffer.length),
      kind,
      addedAt: new Date(),
      objectKey,
      mimeType: PDF_MIME,
    });
    if (updated) {
      await this.syncActiveDeal.execute(updated);
    }
    return { document, leadDocumentId: generatedId };
  }
}
