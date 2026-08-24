import {
  isLegalDocKind,
  type LegalDocKind,
} from '../entities/agent-profile.entity';
import { InvalidLegalDocumentKindError } from '../errors/invalid-legal-document-kind.error';

/** Valida o path param `:kind` antes de chegar no repositório/enum Prisma. */
export function parseLegalDocKind(
  context: string,
  value: string,
): LegalDocKind {
  const normalized = value?.trim().toLowerCase() ?? '';
  if (!isLegalDocKind(normalized)) {
    throw new InvalidLegalDocumentKindError(context, value);
  }
  return normalized;
}
