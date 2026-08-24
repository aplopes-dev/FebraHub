import {
  isDocumentFolderId,
  isDocumentStatus,
  type DocumentFolderId,
  type DocumentStatus,
} from '../entities/agent-folder-document.entity';
import { InvalidDocumentFolderError } from '../errors/invalid-document-folder.error';
import { InvalidDocumentStatusError } from '../errors/invalid-document-status.error';

/** Valida `folderId` vindo de query/body antes de chegar ao enum Prisma. */
export function parseDocumentFolderId(
  context: string,
  value: string,
): DocumentFolderId {
  const normalized = value?.trim().toLowerCase() ?? '';
  if (!isDocumentFolderId(normalized)) {
    throw new InvalidDocumentFolderError(context, value);
  }
  return normalized;
}

export function parseDocumentStatus(
  context: string,
  value: string,
): DocumentStatus {
  const normalized = value?.trim().toLowerCase() ?? '';
  if (!isDocumentStatus(normalized)) {
    throw new InvalidDocumentStatusError(context, value);
  }
  return normalized;
}
