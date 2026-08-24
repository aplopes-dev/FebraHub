import type { AgentFolderDocumentEntity } from '../../../../domain/entities/agent-folder-document.entity';
import {
  parseLinkedLeadDocumentId,
  parseLinkedPropertyDocumentId,
} from '../../../../application/policies/portfolio-document-mirrors';

export type AgentDocumentHttp = {
  id: string;
  folderId: string;
  name: string;
  status: string;
  sizeLabel: string;
  detailsLabel: string;
  source: string;
  legalKind: string | null;
  hasFile: boolean;
  mimeType: string | null;
  addedAt: string;
  /**
   * Path autenticado quando o download NÃO usa
   * `/v1/settings/profile/.../documents/:id` (ex.: docs de imóvel).
   */
  path?: string;
};

export function mapAgentDocumentToHttp(
  document: AgentFolderDocumentEntity,
): AgentDocumentHttp {
  const propertyLink = parseLinkedPropertyDocumentId(document.id);
  const leadLink = parseLinkedLeadDocumentId(document.id);
  const hasFile = Boolean(document.objectKey);
  const path =
    propertyLink && hasFile
      ? `/v1/properties/${propertyLink.propertyId}/documents/${propertyLink.documentId}`
      : leadLink && hasFile
        ? `/v1/leads/${leadLink.leadId}/documents/${leadLink.documentId}`
        : undefined;

  return {
    id: document.id,
    folderId: document.folderId,
    name: document.name,
    status: document.status,
    sizeLabel: document.sizeLabel,
    detailsLabel: document.detailsLabel,
    source: document.source,
    legalKind: document.legalKind,
    hasFile,
    mimeType: document.mimeType,
    addedAt: document.addedAt.toISOString(),
    ...(path ? { path } : {}),
  };
}
