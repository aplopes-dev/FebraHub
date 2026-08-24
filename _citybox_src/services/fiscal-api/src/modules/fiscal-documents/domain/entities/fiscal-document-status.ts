import type { FiscalDocument } from './fiscal-document.entity';

export type FiscalDocumentStatus = FiscalDocument['status'];

/// Estados em que o documento já teve desfecho junto ao órgão fiscal.
/// Derivados da máquina de estados de `specs/002-fiscal-api/data-model.md`:
/// tudo que não está aqui (DRAFT, VALIDATING, NUMBER_RESERVED, XML_GENERATED,
/// SIGNED, SENT, PROCESSING, SYNC_REQUIRED, ERROR) é intermediário e admite
/// retomada da transmissão.
///
/// Vive aqui, e não dentro de um caso de uso, porque NF-e e NFS-e precisam da
/// mesma classificação — duplicá-la garantiria que as duas divergissem na
/// primeira mudança da máquina de estados.
const TERMINAL_STATUSES = new Set<FiscalDocumentStatus>([
  'AUTHORIZED',
  'REJECTED',
  'DENIED',
  'CANCEL_AUTHORIZED',
  'CORRECTION_LETTER_AUTHORIZED',
  'INUTILIZED',
]);

export function isTerminalStatus(status: FiscalDocumentStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}
