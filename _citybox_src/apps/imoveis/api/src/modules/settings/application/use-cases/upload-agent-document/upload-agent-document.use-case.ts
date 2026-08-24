import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { ImoveisObjectKeyPolicy } from '../../../../properties/application/policies/imoveis-object-key.policy';
import { DocumentFileValidator } from '../../../../properties/application/validators/document-file.validator';
import type { AgentFolderDocumentEntity } from '../../../domain/entities/agent-folder-document.entity';
import {
  parseDocumentFolderId,
  parseDocumentStatus,
} from '../../../domain/mappers/document-enum.mapper';
import { AgentFolderDocumentRepository } from '../../../domain/repositories/agent-folder-document.repository.interface';
import { formatFileSizeLabel } from '../../policies/file-size-label';

export type UploadAgentDocumentInput = {
  storeId: string;
  agentId: string;
  folderId: string;
  buffer: Buffer;
  filename: string;
  detailsLabel?: string;
  status?: string;
};

/** Documento manual da pasta — arquivo no MinIO, metadados no Postgres. */
@Injectable()
export class UploadAgentDocumentUseCase implements IUseCase<
  UploadAgentDocumentInput,
  AgentFolderDocumentEntity
> {
  constructor(
    private readonly documents: AgentFolderDocumentRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(
    input: UploadAgentDocumentInput,
  ): Promise<AgentFolderDocumentEntity> {
    const folderId = parseDocumentFolderId(
      UploadAgentDocumentUseCase.name,
      input.folderId,
    );
    const status = input.status
      ? parseDocumentStatus(UploadAgentDocumentUseCase.name, input.status)
      : 'pending';

    const name = DocumentFileValidator.sanitizeName(input.filename);
    const mimeType = DocumentFileValidator.validate(input.buffer, name);

    const objectKey = ImoveisObjectKeyPolicy.agentFolderDocumentKey(
      input.storeId,
      input.agentId,
      randomUUID(),
      mimeType,
    );
    await this.storage.put({ key: objectKey, buffer: input.buffer, mimeType });

    return this.documents.create(input.storeId, input.agentId, {
      folderId,
      name,
      status,
      sizeLabel: formatFileSizeLabel(input.buffer.length),
      detailsLabel: input.detailsLabel?.trim() ?? '',
      objectKey,
      mimeType,
      source: 'manual',
      legalKind: null,
    });
  }
}
