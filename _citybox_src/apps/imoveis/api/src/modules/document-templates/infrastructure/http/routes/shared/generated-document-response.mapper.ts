import type { GeneratedDocumentEntity } from '../../../../domain/entities/generated-document.entity';

export function mapGeneratedDocumentToHttp(
  document: GeneratedDocumentEntity,
  leadDocumentId: string | null,
) {
  const path = leadDocumentId
    ? `/v1/leads/${document.leadId}/documents/${leadDocumentId}`
    : `/v1/documents/${document.id}`;
  return {
    id: document.id,
    templateId: document.templateId,
    titulo: document.titulo,
    status: document.status,
    mimeType: document.mimeType,
    leadId: document.leadId,
    dealId: document.dealId,
    propertyId: document.propertyId,
    appointmentId: document.appointmentId,
    transactionId: document.transactionId,
    leadDocumentId,
    path,
    createdAt: document.createdAt.toISOString(),
  };
}
