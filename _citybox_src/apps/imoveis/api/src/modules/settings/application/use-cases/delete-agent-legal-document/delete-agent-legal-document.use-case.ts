import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import type { AgentProfileEntity } from '../../../domain/entities/agent-profile.entity';
import { AgentLegalDocumentNotFoundError } from '../../../domain/errors/agent-legal-document-not-found.error';
import { AgentProfileNotFoundError } from '../../../domain/errors/agent-profile-not-found.error';
import { parseLegalDocKind } from '../../../domain/mappers/legal-doc-kind.mapper';
import { AgentProfileRepository } from '../../../domain/repositories/agent-profile.repository.interface';

export type DeleteAgentLegalDocumentInput = {
  storeId: string;
  agentId: string;
  kind: string;
};

@Injectable()
export class DeleteAgentLegalDocumentUseCase implements IUseCase<
  DeleteAgentLegalDocumentInput,
  AgentProfileEntity
> {
  constructor(
    private readonly profiles: AgentProfileRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(
    input: DeleteAgentLegalDocumentInput,
  ): Promise<AgentProfileEntity> {
    const kind = parseLegalDocKind(
      DeleteAgentLegalDocumentUseCase.name,
      input.kind,
    );

    const profile = await this.profiles.findByAgentId(
      input.storeId,
      input.agentId,
    );
    if (!profile) {
      throw new AgentProfileNotFoundError(
        DeleteAgentLegalDocumentUseCase.name,
        input.agentId,
      );
    }
    const document = profile.findLegalDocument(kind);
    if (!document) {
      throw new AgentLegalDocumentNotFoundError(
        DeleteAgentLegalDocumentUseCase.name,
        kind,
      );
    }

    const updated = await this.profiles.removeLegalDocument(
      input.storeId,
      input.agentId,
      kind,
    );
    if (!updated) {
      throw new AgentProfileNotFoundError(
        DeleteAgentLegalDocumentUseCase.name,
        input.agentId,
      );
    }

    await this.storage.delete(document.objectKey);
    return updated;
  }
}
