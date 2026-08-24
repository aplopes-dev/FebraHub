import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { ImoveisObjectKeyPolicy } from '../../../../properties/application/policies/imoveis-object-key.policy';
import { DocumentFileValidator } from '../../../../properties/application/validators/document-file.validator';
import type { AgentProfileEntity } from '../../../domain/entities/agent-profile.entity';
import { AgentProfileNotFoundError } from '../../../domain/errors/agent-profile-not-found.error';
import { parseLegalDocKind } from '../../../domain/mappers/legal-doc-kind.mapper';
import { AgentProfileRepository } from '../../../domain/repositories/agent-profile.repository.interface';
import { formatFileSizeLabel } from '../../policies/file-size-label';

export type UpsertAgentLegalDocumentInput = {
  storeId: string;
  agentId: string;
  kind: string;
  buffer: Buffer;
  filename: string;
};

/** Um arquivo por tipo — reenviar substitui o anterior (objeto e linha). */
@Injectable()
export class UpsertAgentLegalDocumentUseCase implements IUseCase<
  UpsertAgentLegalDocumentInput,
  AgentProfileEntity
> {
  constructor(
    private readonly profiles: AgentProfileRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(
    input: UpsertAgentLegalDocumentInput,
  ): Promise<AgentProfileEntity> {
    const kind = parseLegalDocKind(
      UpsertAgentLegalDocumentUseCase.name,
      input.kind,
    );
    const name = DocumentFileValidator.sanitizeName(input.filename);
    const mimeType = DocumentFileValidator.validate(input.buffer, name);

    const profile = await this.profiles.ensure(input.storeId, input.agentId);
    const previous = profile.findLegalDocument(kind);

    const documentId = randomUUID();
    const objectKey = ImoveisObjectKeyPolicy.agentLegalDocumentKey(
      input.storeId,
      input.agentId,
      kind,
      documentId,
      mimeType,
    );

    await this.storage.put({ key: objectKey, buffer: input.buffer, mimeType });

    const updated = await this.profiles.upsertLegalDocument(
      input.storeId,
      input.agentId,
      {
        kind,
        name,
        sizeLabel: formatFileSizeLabel(input.buffer.length),
        objectKey,
        mimeType,
      },
    );
    if (!updated) {
      await this.storage.delete(objectKey);
      throw new AgentProfileNotFoundError(
        UpsertAgentLegalDocumentUseCase.name,
        input.agentId,
      );
    }

    if (previous) {
      await this.storage.delete(previous.objectKey);
    }

    return updated;
  }
}
