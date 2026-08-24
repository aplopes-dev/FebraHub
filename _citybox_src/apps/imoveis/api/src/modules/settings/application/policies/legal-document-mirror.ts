import {
  AgentFolderDocumentEntity,
  type AgentFolderDocumentProps,
} from '../../domain/entities/agent-folder-document.entity';
import type {
  AgentProfileEntity,
  LegalDocKind,
} from '../../domain/entities/agent-profile.entity';
import { isLegalDocKind } from '../../domain/entities/agent-profile.entity';

const MIRROR_ID_PREFIX = 'legal-';

/** Mesmos rótulos de `LEGAL_DOC_LABEL` no web. */
export const LEGAL_DOC_LABEL: Record<LegalDocKind, string> = {
  license: 'Licença de corretor',
  employment: 'Contrato de trabalho',
  insurance: 'Comprovante de seguro (E&O)',
};

export function mirroredLegalDocumentId(kind: LegalDocKind): string {
  return `${MIRROR_ID_PREFIX}${kind}`;
}

/** `null` quando o id não é de um espelho (documento real da pasta). */
export function parseMirroredLegalDocumentId(
  documentId: string,
): LegalDocKind | null {
  if (!documentId.startsWith(MIRROR_ID_PREFIX)) return null;
  const kind = documentId.slice(MIRROR_ID_PREFIX.length);
  return isLegalDocKind(kind) ? kind : null;
}

/**
 * Documentos legais do perfil aparecem na pasta `legal` como entradas
 * sintéticas — a fonte de verdade continua sendo `AgentLegalDocument`, então
 * um `kind` já materializado na pasta não é espelhado de novo.
 */
export function buildLegalDocumentMirrors(
  profile: AgentProfileEntity | null,
  stored: readonly AgentFolderDocumentEntity[],
): AgentFolderDocumentEntity[] {
  if (!profile) return [];
  const materialized = new Set(
    stored
      .filter((doc) => doc.source === 'profile-legal' && doc.legalKind)
      .map((doc) => doc.legalKind as LegalDocKind),
  );

  return profile.legalDocuments
    .filter((document) => !materialized.has(document.kind))
    .map((document) => {
      const props: AgentFolderDocumentProps = {
        storeId: profile.storeId,
        agentId: profile.agentId,
        folderId: 'legal',
        name: document.name,
        status: 'completed',
        sizeLabel: document.sizeLabel,
        detailsLabel: LEGAL_DOC_LABEL[document.kind],
        objectKey: document.objectKey,
        mimeType: document.mimeType,
        source: 'profile-legal',
        legalKind: document.kind,
        addedAt: new Date(),
      };
      return AgentFolderDocumentEntity.create(
        props,
        mirroredLegalDocumentId(document.kind),
      );
    });
}
