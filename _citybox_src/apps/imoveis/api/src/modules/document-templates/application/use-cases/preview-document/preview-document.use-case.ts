import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { DocumentTemplateNotFoundError } from '../../../domain/errors/document-template-not-found.error';
import { DocumentTemplateRepository } from '../../../domain/repositories/document-template.repository.interface';
import {
  assertTemplateMatchesContext,
  resolveDocumentContextIds,
} from '../../policies/document-context.policy';
import { interpolateTemplate } from '../../policies/interpolate-template';
import { DocumentMergeContextLoader } from '../../services/document-merge-context.loader';

export type PreviewDocumentInput = {
  storeId: string;
  templateId: string;
  leadId?: string;
  appointmentId?: string;
  transactionId?: string;
  actorAgentId?: string;
};

export type PreviewDocumentResult = {
  html: string;
  titulo: string;
  tipo: string;
};

@Injectable()
export class PreviewDocumentUseCase implements IUseCase<
  PreviewDocumentInput,
  PreviewDocumentResult
> {
  constructor(
    private readonly templates: DocumentTemplateRepository,
    private readonly loader: DocumentMergeContextLoader,
  ) {}

  async execute(input: PreviewDocumentInput): Promise<PreviewDocumentResult> {
    const template = await this.templates.findById(
      input.storeId,
      input.templateId,
    );
    if (!template) throw new DocumentTemplateNotFoundError(input.templateId);
    const resolved = resolveDocumentContextIds(input, PreviewDocumentUseCase.name);
    assertTemplateMatchesContext(
      template.tipo,
      resolved.kind,
      PreviewDocumentUseCase.name,
    );
    const loaded = await this.loader.load(
      input.storeId,
      resolved,
      input.actorAgentId,
    );
    return {
      html: interpolateTemplate(template.conteudoHtml, loaded.snapshot),
      titulo: template.nome,
      tipo: template.tipo,
    };
  }
}
