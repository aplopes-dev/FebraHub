import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { AgentFolderDocumentNotFoundError } from '../../../domain/errors/agent-folder-document-not-found.error';
import { AgentFolderDocumentRepository } from '../../../domain/repositories/agent-folder-document.repository.interface';
import { AgentProfileRepository } from '../../../domain/repositories/agent-profile.repository.interface';
import { parseMirroredLegalDocumentId } from '../../policies/legal-document-mirror';
import { isLinkedPortfolioDocumentId } from '../../policies/portfolio-document-mirrors';

export type DeleteAgentDocumentInput = {
  storeId: string;
  agentId: string;
  documentId: string;
};

/**
 * Apagar um espelho remove o documento legal do perfil.
 * Docs de lead/imóvel linkados não se apagam por aqui.
 */
@Injectable()
export class DeleteAgentDocumentUseCase implements IUseCase<
  DeleteAgentDocumentInput,
  void
> {
  constructor(
    private readonly documents: AgentFolderDocumentRepository,
    private readonly profiles: AgentProfileRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(input: DeleteAgentDocumentInput): Promise<void> {
    if (isLinkedPortfolioDocumentId(input.documentId)) {
      throw new AgentFolderDocumentNotFoundError(
        DeleteAgentDocumentUseCase.name,
        input.documentId,
      );
    }

    const mirroredKind = parseMirroredLegalDocumentId(input.documentId);
    if (mirroredKind) {
      const profile = await this.profiles.findByAgentId(
        input.storeId,
        input.agentId,
      );
      const legal = profile?.findLegalDocument(mirroredKind);
      if (!legal) {
        throw new AgentFolderDocumentNotFoundError(
          DeleteAgentDocumentUseCase.name,
          input.documentId,
        );
      }
      await this.profiles.removeLegalDocument(
        input.storeId,
        input.agentId,
        mirroredKind,
      );
      await this.storage.delete(legal.objectKey);
      return;
    }

    const document = await this.documents.findById(
      input.storeId,
      input.agentId,
      input.documentId,
    );
    if (!document) {
      throw new AgentFolderDocumentNotFoundError(
        DeleteAgentDocumentUseCase.name,
        input.documentId,
      );
    }

    await this.documents.delete(input.storeId, input.agentId, input.documentId);
    if (document.objectKey) {
      await this.storage.delete(document.objectKey);
    }
  }
}
