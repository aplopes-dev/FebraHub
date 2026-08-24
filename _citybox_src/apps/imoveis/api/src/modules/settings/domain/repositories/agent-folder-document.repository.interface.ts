import type { LegalDocKind } from '../entities/agent-profile.entity';
import type {
  AgentFolderDocumentEntity,
  DocumentFolderId,
  DocumentSource,
  DocumentStatus,
} from '../entities/agent-folder-document.entity';

export type AgentFolderDocumentCreatePayload = {
  folderId: DocumentFolderId;
  name: string;
  status: DocumentStatus;
  sizeLabel: string;
  detailsLabel: string;
  objectKey: string | null;
  mimeType: string | null;
  source: DocumentSource;
  legalKind: LegalDocKind | null;
};

export type AgentFolderDocumentUpdatePayload = {
  status?: DocumentStatus;
  detailsLabel?: string;
};

export abstract class AgentFolderDocumentRepository {
  abstract findAll(
    storeId: string,
    agentId: string,
    folderId?: DocumentFolderId,
  ): Promise<AgentFolderDocumentEntity[]>;

  abstract findById(
    storeId: string,
    agentId: string,
    documentId: string,
  ): Promise<AgentFolderDocumentEntity | null>;

  abstract create(
    storeId: string,
    agentId: string,
    payload: AgentFolderDocumentCreatePayload,
  ): Promise<AgentFolderDocumentEntity>;

  abstract update(
    storeId: string,
    agentId: string,
    documentId: string,
    payload: AgentFolderDocumentUpdatePayload,
  ): Promise<AgentFolderDocumentEntity | null>;

  abstract delete(
    storeId: string,
    agentId: string,
    documentId: string,
  ): Promise<boolean>;

  /** Usado na exclusão de conta — devolve as keys para limpar no MinIO. */
  abstract deleteAllForAgent(
    storeId: string,
    agentId: string,
  ): Promise<string[]>;
}
