import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { AgentLegalDocumentNotFoundError } from '../../../domain/errors/agent-legal-document-not-found.error';
import { parseLegalDocKind } from '../../../domain/mappers/legal-doc-kind.mapper';
import { AgentProfileRepository } from '../../../domain/repositories/agent-profile.repository.interface';

export type GetAgentLegalDocumentInput = {
  storeId: string;
  agentId: string;
  kind: string;
};

export type GetAgentLegalDocumentResult = {
  buffer: Buffer;
  mimeType: string;
  name: string;
};

@Injectable()
export class GetAgentLegalDocumentUseCase implements IUseCase<
  GetAgentLegalDocumentInput,
  GetAgentLegalDocumentResult
> {
  constructor(
    private readonly profiles: AgentProfileRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(
    input: GetAgentLegalDocumentInput,
  ): Promise<GetAgentLegalDocumentResult> {
    const kind = parseLegalDocKind(
      GetAgentLegalDocumentUseCase.name,
      input.kind,
    );

    const profile = await this.profiles.findByAgentId(
      input.storeId,
      input.agentId,
    );
    const document = profile?.findLegalDocument(kind);
    if (!document) {
      throw new AgentLegalDocumentNotFoundError(
        GetAgentLegalDocumentUseCase.name,
        kind,
      );
    }

    const stored = await this.storage.get(document.objectKey);
    return {
      buffer: stored.buffer,
      mimeType: stored.mimeType,
      name: document.name,
    };
  }
}
