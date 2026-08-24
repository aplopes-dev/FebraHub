import {
  AgentFolderDocumentEntity,
  type AgentFolderDocumentProps,
  type DocumentFolderId,
} from '../../domain/entities/agent-folder-document.entity';

const LEAD_PREFIX = 'linked-lead:';
const PROPERTY_PREFIX = 'linked-property:';

export type PortfolioLeadDocumentRow = {
  id: string;
  leadId: string;
  leadName: string;
  name: string;
  sizeLabel: string;
  kind: 'contract' | 'other';
  addedAt: Date;
  objectKey: string | null;
  mimeType: string | null;
};

export type PortfolioPropertyDocumentRow = {
  id: string;
  propertyId: string;
  propertyName: string;
  name: string;
  sizeLabel: string;
  objectKey: string | null;
  mimeType: string;
  createdAt: Date;
};

export function linkedLeadDocumentId(
  leadId: string,
  documentId: string,
): string {
  return `${LEAD_PREFIX}${leadId}:${documentId}`;
}

export function linkedPropertyDocumentId(
  propertyId: string,
  documentId: string,
): string {
  return `${PROPERTY_PREFIX}${propertyId}:${documentId}`;
}

export function isLinkedPortfolioDocumentId(documentId: string): boolean {
  return (
    documentId.startsWith(LEAD_PREFIX) || documentId.startsWith(PROPERTY_PREFIX)
  );
}

export function parseLinkedLeadDocumentId(
  documentId: string,
): { leadId: string; documentId: string } | null {
  if (!documentId.startsWith(LEAD_PREFIX)) return null;
  const rest = documentId.slice(LEAD_PREFIX.length);
  const sep = rest.indexOf(':');
  if (sep <= 0 || sep === rest.length - 1) return null;
  return {
    leadId: rest.slice(0, sep),
    documentId: rest.slice(sep + 1),
  };
}

/** Parse path for authenticated download (property has blob; lead uses objectKey). */
export function parseLinkedPropertyDocumentId(
  documentId: string,
): { propertyId: string; documentId: string } | null {
  if (!documentId.startsWith(PROPERTY_PREFIX)) return null;
  const rest = documentId.slice(PROPERTY_PREFIX.length);
  const sep = rest.indexOf(':');
  if (sep <= 0 || sep === rest.length - 1) return null;
  return {
    propertyId: rest.slice(0, sep),
    documentId: rest.slice(sep + 1),
  };
}

export function buildLeadDocumentMirrors(
  storeId: string,
  agentId: string,
  rows: readonly PortfolioLeadDocumentRow[],
): AgentFolderDocumentEntity[] {
  return rows.map((row) => {
    const isContract = row.kind === 'contract';
    const props: AgentFolderDocumentProps = {
      storeId,
      agentId,
      folderId: isContract ? 'signed' : 'client',
      name: row.name,
      status: 'completed',
      sizeLabel: row.sizeLabel || '—',
      detailsLabel: isContract
        ? `Contrato · ${row.leadName.trim() || 'Lead'}`
        : row.leadName.trim() || 'Lead',
      objectKey: row.objectKey,
      mimeType: row.mimeType,
      source: 'linked-lead',
      legalKind: null,
      addedAt: row.addedAt,
    };
    return AgentFolderDocumentEntity.create(
      props,
      linkedLeadDocumentId(row.leadId, row.id),
    );
  });
}

export function buildPropertyDocumentMirrors(
  storeId: string,
  agentId: string,
  rows: readonly PortfolioPropertyDocumentRow[],
): AgentFolderDocumentEntity[] {
  return rows.map((row) => {
    const props: AgentFolderDocumentProps = {
      storeId,
      agentId,
      folderId: 'property',
      name: row.name,
      status: 'completed',
      sizeLabel: row.sizeLabel || '—',
      detailsLabel: row.propertyName.trim() || 'Imóvel',
      objectKey: row.objectKey,
      mimeType: row.mimeType || null,
      source: 'linked-property',
      legalKind: null,
      addedAt: row.createdAt,
    };
    return AgentFolderDocumentEntity.create(
      props,
      linkedPropertyDocumentId(row.propertyId, row.id),
    );
  });
}

export function filterByFolder(
  items: readonly AgentFolderDocumentEntity[],
  folderId: DocumentFolderId | undefined,
): AgentFolderDocumentEntity[] {
  if (!folderId) return [...items];
  return items.filter((doc) => doc.folderId === folderId);
}
