import type { FiscalDocumentStatus } from '../../../fiscal-documents/domain/entities/fiscal-document.entity';

/// Estados em que a nota **existe e vale** junto ao órgão fiscal — os únicos
/// que produzem documento auxiliar (FR-003).
///
/// `CANCEL_REQUESTED` entra porque o cancelamento ainda não foi confirmado: a
/// nota vale durante essa janela, e recusar deixaria mercadoria sem documento.
/// `CANCEL_REJECTED` entra porque o órgão RECUSOU o cancelamento — a nota
/// nunca deixou de valer. `CANCEL_AUTHORIZED` entra por FR-006: é entregue
/// marcada, não recusada, porque o histórico precisa ser reconstituível.
const PRINTABLE_STATUSES: ReadonlySet<FiscalDocumentStatus> = new Set([
  'AUTHORIZED',
  'CORRECTION_LETTER_AUTHORIZED',
  'CANCEL_REQUESTED',
  'CANCEL_AUTHORIZED',
  'CANCEL_REJECTED',
]);

export function isPrintable(status: FiscalDocumentStatus): boolean {
  return PRINTABLE_STATUSES.has(status);
}

/// Se o documento sai **marcado como cancelado** (FR-006).
///
/// Só `CANCEL_AUTHORIZED`. Marcar em `CANCEL_REQUESTED` produziria um papel
/// dizendo que a nota não vale enquanto ela ainda vale — e o pedido de
/// cancelamento pode ser recusado. Marcar em `CANCEL_REJECTED` seria
/// simplesmente falso.
export function isCancelledStatus(status: FiscalDocumentStatus): boolean {
  return status === 'CANCEL_AUTHORIZED';
}
