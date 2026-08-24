import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  ContingencyQueueRepository,
  type ContingencyEntry,
  type EnqueueContingencyInput,
} from '../../domain/contingency/contingency-queue.repository';

type Row = {
  id: string;
  fiscalDocumentId: string;
  companyId: string;
  sequence: bigint;
  emittedAt: Date;
  status: string;
  attempts: number;
  lastError: string | null;
  transmittedAt: Date | null;
};

function toEntry(row: Row): ContingencyEntry {
  return {
    id: row.id,
    fiscalDocumentId: row.fiscalDocumentId,
    companyId: row.companyId,
    sequence: row.sequence,
    emittedAt: row.emittedAt,
    status: row.status as ContingencyEntry['status'],
    attempts: row.attempts,
    lastError: row.lastError,
    transmittedAt: row.transmittedAt,
  };
}

@Injectable()
export class PrismaContingencyQueueRepository extends ContingencyQueueRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  /// ⚠️ **Serializado por lock consultivo, por Emitente.**
  ///
  /// A primeira versão calculava a `sequence` por subconsulta dentro do
  /// próprio `INSERT`, na crença de que isso bastaria para serializar. **Não
  /// basta**, e o teste de integração provou: em `READ COMMITTED`, duas
  /// transações concorrentes executam `SELECT MAX(sequence)` e **ambas veem o
  /// mesmo valor** — a linha da outra ainda não está visível. As duas tentam a
  /// mesma posição e a segunda morre em
  /// `nfce_contingency_queue_company_sequence_key`.
  ///
  /// No balcão isso é uma venda perdida: dois caixas fechando no mesmo instante
  /// e um deles recebe erro.
  ///
  /// `pg_advisory_xact_lock` resolve porque serializa de verdade, e o escopo é
  /// **por Emitente** (`hashtext(company_id)`): duas lojas diferentes seguem
  /// enfileirando em paralelo, sem gargalo global. O lock é liberado no fim da
  /// transação, sem `unlock` explícito — daí a variante `_xact_`, que não
  /// vaza se algo estourar no meio.
  ///
  /// ⚠️ Nenhum teste de unidade pegaria isto: um dublê em memória é sequencial
  /// por natureza, e passava.
  async enqueue(input: EnqueueContingencyInput): Promise<ContingencyEntry> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(hashtext(${input.companyId}))
      `;

      const rows = await tx.$queryRaw<Row[]>`
        INSERT INTO fiscal.nfce_contingency_queue
          (fiscal_document_id, company_id, sequence, emitted_at, status, updated_at)
        VALUES (
          ${input.fiscalDocumentId}::uuid,
          ${input.companyId}::uuid,
          (
            SELECT COALESCE(MAX(sequence), 0) + 1
            FROM fiscal.nfce_contingency_queue
            WHERE company_id = ${input.companyId}::uuid
          ),
          ${input.emittedAt},
          'PENDING',
          NOW()
        )
        RETURNING
          id,
          fiscal_document_id AS "fiscalDocumentId",
          company_id         AS "companyId",
          sequence,
          emitted_at         AS "emittedAt",
          status::text       AS status,
          attempts,
          last_error         AS "lastError",
          transmitted_at     AS "transmittedAt"
      `;

      return toEntry(rows[0]);
    });
  }

  /// `ORDER BY sequence` — a ordem de emissão. É a invariante que o dreno
  /// depende e a razão de a coluna existir; ordenar por `emitted_at` pareceria
  /// equivalente e empataria entre cupons do mesmo instante.
  ///
  /// O índice parcial `WHERE status = 'PENDING'` atende exatamente esta
  /// consulta.
  async findPending(
    companyId: string,
    limit: number,
  ): Promise<ContingencyEntry[]> {
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT
        id,
        fiscal_document_id AS "fiscalDocumentId",
        company_id         AS "companyId",
        sequence,
        emitted_at         AS "emittedAt",
        status::text       AS status,
        attempts,
        last_error         AS "lastError",
        transmitted_at     AS "transmittedAt"
      FROM fiscal.nfce_contingency_queue
      WHERE company_id = ${companyId}::uuid AND status = 'PENDING'
      ORDER BY sequence
      LIMIT ${limit}
    `;
    return rows.map(toEntry);
  }

  async markTransmitted(id: string, at: Date): Promise<void> {
    // `transmitted_at` e `status` mudam juntos: a CHECK constraint da migration
    // recusa um sem o outro. Não é redundância — é o que impede a fila de ter
    // linha que "parece resolvida".
    await this.prisma.$executeRaw`
      UPDATE fiscal.nfce_contingency_queue
      SET status = 'TRANSMITTED', transmitted_at = ${at}, updated_at = NOW()
      WHERE id = ${id}::uuid
    `;
  }

  async markRejected(id: string, error: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE fiscal.nfce_contingency_queue
      SET status = 'REJECTED',
          last_error = ${error},
          attempts = attempts + 1,
          updated_at = NOW()
      WHERE id = ${id}::uuid
    `;
  }

  async registerAttempt(id: string, error: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE fiscal.nfce_contingency_queue
      SET attempts = attempts + 1, last_error = ${error}, updated_at = NOW()
      WHERE id = ${id}::uuid
    `;
  }

  /// Sem filtro de Emitente, ao contrário de `findPending`: o alarme de prazo
  /// é da operação inteira, e limitar por contribuinte faria alguém precisar
  /// saber de antemão qual loja checar.
  async findOverdue(
    threshold: Date,
    limit: number,
  ): Promise<ContingencyEntry[]> {
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT
        id,
        fiscal_document_id AS "fiscalDocumentId",
        company_id         AS "companyId",
        sequence,
        emitted_at         AS "emittedAt",
        status::text       AS status,
        attempts,
        last_error         AS "lastError",
        transmitted_at     AS "transmittedAt"
      FROM fiscal.nfce_contingency_queue
      WHERE status = 'PENDING' AND emitted_at < ${threshold}
      ORDER BY emitted_at
      LIMIT ${limit}
    `;
    return rows.map(toEntry);
  }
}
