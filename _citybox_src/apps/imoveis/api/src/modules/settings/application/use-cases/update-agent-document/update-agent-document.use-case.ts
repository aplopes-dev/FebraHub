import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { AgentFolderDocumentEntity } from '../../../domain/entities/agent-folder-document.entity';
import { AgentFolderDocumentNotFoundError } from '../../../domain/errors/agent-folder-document-not-found.error';
import { parseDocumentStatus } from '../../../domain/mappers/document-enum.mapper';
import { AgentFolderDocumentRepository } from '../../../domain/repositories/agent-folder-document.repository.interface';
import { parseMirroredLegalDocumentId } from '../../policies/legal-document-mirror';
import { isLinkedPortfolioDocumentId } from '../../policies/portfolio-document-mirrors';

export type UpdateAgentDocumentInput = {
  storeId: string;
  agentId: string;
  documentId: string;
  status?: string;
  detailsLabel?: string;
};

/** Espelhos legais e docs de lead/imóvel não são editáveis nesta aba. */
@Injectable()
export class UpdateAgentDocumentUseCase implements IUseCase<
  UpdateAgentDocumentInput,
  AgentFolderDocumentEntity
> {
  constructor(private readonly documents: AgentFolderDocumentRepository) {}

  async execute(
    input: UpdateAgentDocumentInput,
  ): Promise<AgentFolderDocumentEntity> {
    if (
      parseMirroredLegalDocumentId(input.documentId) ||
      isLinkedPortfolioDocumentId(input.documentId)
    ) {
      throw new AgentFolderDocumentNotFoundError(
        UpdateAgentDocumentUseCase.name,
        input.documentId,
      );
    }

    const status = input.status
      ? parseDocumentStatus(UpdateAgentDocumentUseCase.name, input.status)
      : undefined;

    const updated = await this.documents.update(
      input.storeId,
      input.agentId,
      input.documentId,
      { status, detailsLabel: input.detailsLabel?.trim() },
    );
    if (!updated) {
      throw new AgentFolderDocumentNotFoundError(
        UpdateAgentDocumentUseCase.name,
        input.documentId,
      );
    }
    return updated;
  }
}
