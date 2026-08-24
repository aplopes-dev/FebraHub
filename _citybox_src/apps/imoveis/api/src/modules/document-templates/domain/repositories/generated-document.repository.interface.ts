import type { GeneratedDocumentEntity } from '../entities/generated-document.entity';
import type { DocumentMergeSnapshot } from '../../application/policies/document-variable-catalog';
import type { ApiGeneratedDocumentStatus } from '../mappers/document-template-enum.mapper';

export type GeneratedDocumentWritePayload = {
  id?: string;
  storeId: string;
  templateId: string;
  titulo: string;
  conteudoRender: string;
  dadosSnapshot: DocumentMergeSnapshot;
  objectKey: string;
  mimeType: string;
  status?: ApiGeneratedDocumentStatus;
  leadId?: string | null;
  dealId?: string | null;
  propertyId?: string | null;
  appointmentId?: string | null;
  transactionId?: string | null;
};

export abstract class GeneratedDocumentRepository {
  abstract create(
    payload: GeneratedDocumentWritePayload,
  ): Promise<GeneratedDocumentEntity>;

  abstract findById(
    storeId: string,
    id: string,
  ): Promise<GeneratedDocumentEntity | null>;
}
