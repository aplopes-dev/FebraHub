import { Entity } from '../../../../shared/core/entity';
import type { LegalDocKind } from './agent-profile.entity';

/** Pastas da aba Documentos — espelha `DocumentFolderId` no web. */
export const DOCUMENT_FOLDER_IDS = [
  'client',
  'property',
  'legal',
  'signed',
] as const;

export type DocumentFolderId = (typeof DOCUMENT_FOLDER_IDS)[number];

export function isDocumentFolderId(value: string): value is DocumentFolderId {
  return (DOCUMENT_FOLDER_IDS as readonly string[]).includes(value);
}

export const DOCUMENT_STATUSES = ['pending', 'completed', 'archived'] as const;

export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export function isDocumentStatus(value: string): value is DocumentStatus {
  return (DOCUMENT_STATUSES as readonly string[]).includes(value);
}

/** `profile-legal` = espelho do perfil; linked-* = docs de lead/imóvel (somente leitura). */
export type DocumentSource =
  | 'manual'
  | 'profile-legal'
  | 'linked-lead'
  | 'linked-property';

export type AgentFolderDocumentProps = {
  storeId: string;
  agentId: string;
  folderId: DocumentFolderId;
  name: string;
  status: DocumentStatus;
  sizeLabel: string;
  detailsLabel: string;
  objectKey: string | null;
  mimeType: string | null;
  source: DocumentSource;
  legalKind: LegalDocKind | null;
  addedAt: Date;
};

export class AgentFolderDocumentEntity extends Entity<AgentFolderDocumentProps> {
  get storeId(): string {
    return this.props.storeId;
  }
  get agentId(): string {
    return this.props.agentId;
  }
  get folderId(): DocumentFolderId {
    return this.props.folderId;
  }
  get name(): string {
    return this.props.name;
  }
  get status(): DocumentStatus {
    return this.props.status;
  }
  get sizeLabel(): string {
    return this.props.sizeLabel;
  }
  get detailsLabel(): string {
    return this.props.detailsLabel;
  }
  get objectKey(): string | null {
    return this.props.objectKey;
  }
  get mimeType(): string | null {
    return this.props.mimeType;
  }
  get source(): DocumentSource {
    return this.props.source;
  }
  get legalKind(): LegalDocKind | null {
    return this.props.legalKind;
  }
  get addedAt(): Date {
    return this.props.addedAt;
  }

  protected validate(): void {
    if (!this.props.storeId) throw new Error('storeId is required');
    if (!this.props.agentId) throw new Error('agentId is required');
    if (!this.props.name) throw new Error('name is required');
  }

  static create(
    props: AgentFolderDocumentProps,
    id?: string,
  ): AgentFolderDocumentEntity {
    const entity = new AgentFolderDocumentEntity({ ...props }, id);
    entity.validate();
    return entity;
  }
}
