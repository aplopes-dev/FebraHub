import { Injectable, Logger } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ContingencyQueueRepository } from '../../../domain/contingency/contingency-queue.repository';
import {
  contingencyDeadlineHours,
  overdueThreshold,
} from '../../../domain/contingency/transmission-deadline';

const ALERT_BATCH = 200;

export type OverdueContingencyAlert = {
  fiscalDocumentId: string;
  companyId: string;
  emittedAt: Date;
  hoursOverdue: number;
  attempts: number;
  lastError: string | null;
};

export type AlertOverdueContingencyResult = {
  overdue: OverdueContingencyAlert[];
};

/// T055 / FR-010 — alarme de **prazo legal excedido** na fila de contingência.
///
/// ⚠️ **Por que isto não é um retry a mais.**
///
/// Um cupom parado na fila além do prazo deixou de ser pendência técnica e
/// virou **problema fiscal**: o documento está em circulação, com o
/// consumidor, e o fisco não o recebeu no prazo. Nenhuma retentativa conserta
/// isso — a regularização é administrativa.
///
/// Por isso este caso de uso **não tenta transmitir nada**. Ele só torna a
/// situação visível. Misturá-lo ao dreno faria o pior caso parecer resolvido a
/// cada ciclo: "tentei de novo" não é o mesmo que "está resolvido", e a
/// diferença só apareceria numa fiscalização.
@Injectable()
export class AlertOverdueContingencyUseCase implements IUseCase<
  void,
  AlertOverdueContingencyResult
> {
  private readonly logger = new Logger(AlertOverdueContingencyUseCase.name);

  constructor(private readonly queue: ContingencyQueueRepository) {}

  async execute(): Promise<AlertOverdueContingencyResult> {
    const now = new Date();
    const entries = await this.queue.findOverdue(
      overdueThreshold(now),
      ALERT_BATCH,
    );

    const overdue = entries.map((entry) => ({
      fiscalDocumentId: entry.fiscalDocumentId,
      companyId: entry.companyId,
      emittedAt: entry.emittedAt,
      hoursOverdue:
        (now.getTime() - entry.emittedAt.getTime()) / 3_600_000 -
        contingencyDeadlineHours(),
      attempts: entry.attempts,
      lastError: entry.lastError,
    }));

    for (const alert of overdue) {
      // Nível ERRO, uma linha por cupom. Agregar em "N cupons atrasados"
      // pouparia log e tiraria de quem investiga exatamente o que precisa:
      // qual documento, de qual Emitente, há quanto tempo.
      this.logger.error(
        `Cupom em contingência FORA DO PRAZO legal de transmissão. ` +
          `Documento ${alert.fiscalDocumentId}, Emitente ${alert.companyId}, ` +
          `emitido em ${alert.emittedAt.toISOString()}, ` +
          `${alert.hoursOverdue.toFixed(1)}h além do prazo, ` +
          `${alert.attempts} tentativa(s). Último erro: ${alert.lastError ?? 'nenhum'}. ` +
          `Exige regularização administrativa — retentativa não resolve.`,
      );
    }

    return { overdue };
  }
}
