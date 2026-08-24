import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { AgentFolderDocumentNotFoundError } from '../../../domain/errors/agent-folder-document-not-found.error';
import { DocumentFileUnavailableError } from '../../../domain/errors/document-file-unavailable.error';
import { AgentFolderDocumentRepository } from '../../../domain/repositories/agent-folder-document.repository.interface';
import { AgentProfileRepository } from '../../../domain/repositories/agent-profile.repository.interface';
import { parseMirroredLegalDocumentId } from '../../policies/legal-document-mirror';

export type GetAgentDocumentInput = {
  storeId: string;
  agentId: string;
  documentId: string;
};

export type GetAgentDocumentResult = {
  buffer: Buffer;
  mimeType: string;
  name: string;
};

/** Serve tanto documentos da pasta quanto os espelhos dos documentos legais. */
@Injectable()
export class GetAgentDocumentUseCase implements IUseCase<
  GetAgentDocumentInput,
  GetAgentDocumentResult
> {
  constructor(
    private readonly documents: AgentFolderDocumentRepository,
    private readonly profiles: AgentProfileRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(input: GetAgentDocumentInput): Promise<GetAgentDocumentResult> {
    const source = await this.resolveSource(input);

    const stored = await this.storage.get(source.objectKey);
    return {
      buffer: stored.buffer,
      mimeType: stored.mimeType,
      name: source.name,
    };
  }

  private async resolveSource(
    input: GetAgentDocumentInput,
  ): Promise<{ objectKey: string; name: string }> {
    const mirroredKind = parseMirroredLegalDocumentId(input.documentId);
    if (mirroredKind) {
      const profile = await this.profiles.findByAgentId(
        input.storeId,
        input.agentId,
      );
      const legal = profile?.findLegalDocument(mirroredKind);
      if (!legal) {
        throw new AgentFolderDocumentNotFoundError(
          GetAgentDocumentUseCase.name,
          input.documentId,
        );
      }
      return { objectKey: legal.objectKey, name: legal.name };
    }

    const document = await this.documents.findById(
      input.storeId,
      input.agentId,
      input.documentId,
    );
    if (!document) {
      throw new AgentFolderDocumentNotFoundError(
        GetAgentDocumentUseCase.name,
        input.documentId,
      );
    }
    if (!document.objectKey) {
      throw new DocumentFileUnavailableError(
        GetAgentDocumentUseCase.name,
        input.documentId,
      );
    }
    return { objectKey: document.objectKey, name: document.name };
  }
}
