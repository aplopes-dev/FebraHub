export const CONTINGENCY_STATUSES = [
  'PENDING',
  'TRANSMITTED',
  'REJECTED',
] as const;
export type ContingencyStatus = (typeof CONTINGENCY_STATUSES)[number];

export type ContingencyEntry = {
  id: string;
  fiscalDocumentId: string;
  companyId: string;
  /// Posição na fila **por Emitente**. É o que garante transmissão na ordem de
  /// emissão — fora de ordem, a numeração chega quebrada à SEFAZ.
  sequence: bigint;
  emittedAt: Date;
  status: ContingencyStatus;
  attempts: number;
  lastError: string | null;
  transmittedAt: Date | null;
};

export type EnqueueContingencyInput = {
  fiscalDocumentId: string;
  companyId: string;
  emittedAt: Date;
};

/// Fila de cupons emitidos em contingência, aguardando transmissão.
///
/// ⚠️ **Persistente, não em memória.** Cada linha aqui representa um cupom que
/// **já foi impresso e entregue ao consumidor**. Perder a fila num restart
/// deixaria papel na mão do cliente sem correspondência junto ao fisco, em
/// silêncio — a pior falha possível desta feature. É por isso que
/// `tests/integration/contingency-queue.integration.spec.ts` roda contra
/// Postgres real: um dublê em memória passaria mesmo com a implementação
/// errada.
export abstract class ContingencyQueueRepository {
  /// Enfileira e devolve a entrada com a `sequence` já atribuída.
  ///
  /// A numeração da fila é do repositório, não do chamador: dois caixas
  /// emitindo ao mesmo tempo precisam de posições distintas, e só o banco
  /// resolve isso sem corrida (`@@unique([companyId, sequence])`).
  abstract enqueue(input: EnqueueContingencyInput): Promise<ContingencyEntry>;

  /// Pendentes do Emitente, **em ordem de emissão**.
  ///
  /// Por Emitente porque a SEFAZ volta ao ar por UF e o dreno opera por
  /// contribuinte; em ordem porque é a razão de a fila existir.
  abstract findPending(
    companyId: string,
    limit: number,
  ): Promise<ContingencyEntry[]>;

  abstract markTransmitted(id: string, at: Date): Promise<void>;

  /// FR-012 — registra a rejeição posterior. Não apaga a linha: o rastro de um
  /// cupom que o consumidor levou e o fisco recusou é exatamente o que precisa
  /// sobreviver.
  abstract markRejected(id: string, error: string): Promise<void>;

  /// Incrementa a contagem de tentativas sem mudar o estado — a entrada segue
  /// `PENDING` e será retentada.
  abstract registerAttempt(id: string, error: string): Promise<void>;

  /// Pendentes emitidos antes de `threshold`, de qualquer Emitente.
  ///
  /// Alimenta o alarme de prazo legal (T055): um cupom parado além do prazo é
  /// **problema fiscal**, não pendência técnica, e precisa de gente olhando —
  /// não de mais uma retentativa silenciosa.
  abstract findOverdue(
    threshold: Date,
    limit: number,
  ): Promise<ContingencyEntry[]>;
}
