import type { Invoice } from '../../../../domain/entities/invoice.entity';

export function toInvoiceResponse(invoice: Invoice) {
  return {
    id: invoice.id,
    subscriptionId: invoice.subscriptionId,
    // `clientId` carrega o id da LOJA desde a Fase 10 — no admin, a loja é o cliente.
    clientId: invoice.storeId,
    clientName: invoice.clientName ?? null,
    clientDocument: invoice.clientDocument ?? null,
    amountCents: invoice.amountCents,
    currency: invoice.currency,
    status: invoice.status,
    dueDate: invoice.dueDate.toISOString(),
    paidAt: invoice.paidAt?.toISOString() ?? null,
    method: invoice.method,
    gatewayPaymentId: invoice.gatewayPaymentId,
    invoiceUrl: invoice.invoiceUrl,
    notes: invoice.notes,
    periodStart: invoice.periodStart.toISOString(),
    periodEnd: invoice.periodEnd.toISOString(),
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString(),
  };
}
