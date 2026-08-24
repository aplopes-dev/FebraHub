import type { FiscalDocument } from '../../../../domain/entities/fiscal-document.entity';
import type { FiscalEvent } from '../../../../domain/entities/fiscal-event.entity';

export function toFiscalDocumentResponse(document: FiscalDocument) {
  return {
    documentId: document.id,
    companyId: document.companyId,
    customerId: document.customerId,
    // Join de leitura (`withCustomerName`) — alimenta a coluna "Cliente" da
    // tela Facilita NFE (spec `009-facilita-nfe-screen`, FR-004).
    customerName: document.customerName,
    documentType: document.documentType,
    provider: document.provider,
    environment: document.environment,
    status: document.status,
    sourceSystem: document.sourceSystem,
    externalReference: document.externalReference,
    series: document.series,
    number: document.number,
    rpsSeries: document.rpsSeries,
    rpsNumber: document.rpsNumber,
    accessKey: document.accessKey,
    verificationCode: document.verificationCode,
    protocol: document.protocol,
    totalAmount: document.totalAmount,
    errorCode: document.errorCode,
    errorMessage: document.errorMessage,
    issuedAt: document.issuedAt,
    authorizedAt: document.authorizedAt,
    cancelledAt: document.cancelledAt,
    // Aponta para a rota específica do tipo de documento (`GET /v1/nfe/{id}/xml`,
    // `GET /v1/nfse/{id}/xml` quando US2 implementar o equivalente) — não existe
    // (nem está planejada) uma rota genérica `/v1/fiscal-documents/{id}/xml`
    // (achado I1 de /speckit-analyze: apontava para um endpoint inexistente).
    xmlUrl: document.xmlObjectKey
      ? `/api/v1/${document.documentType === 'NFE' ? 'nfe' : 'nfse'}/${document.id}/xml`
      : null,
    items: document.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitValue: item.unitValue,
      totalValue: item.totalValue,
      itemType: item.itemType,
    })),
  };
}

export function toFiscalEventResponse(event: FiscalEvent) {
  return {
    eventId: event.id,
    eventType: event.eventType,
    sequence: event.sequence,
    status: event.status,
    justification: event.justification,
    protocol: event.protocol,
    createdAt: event.createdAt,
  };
}
