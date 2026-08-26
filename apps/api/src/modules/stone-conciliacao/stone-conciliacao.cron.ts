import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { StoneConciliacaoService } from './stone-conciliacao.service';

/**
 * Importa o extrato de conciliação Stone do dia anterior, uma vez por dia.
 * A Stone só disponibiliza o arquivo após as 5h da manhã do dia seguinte, então
 * roda às 06:00 (TZ do processo = America/Bahia). Best-effort: nunca derruba o
 * processo. Se a integração não estiver configurada, sai sem ruído.
 */
@Injectable()
export class StoneConciliacaoCron {
  private readonly logger = new Logger(StoneConciliacaoCron.name);

  constructor(private readonly s: StoneConciliacaoService) {}

  @Cron('0 6 * * *', { name: 'stone-conciliacao-diaria' })
  async importarOntem(): Promise<void> {
    if (!this.s.configurado) return;
    try {
      const r = await this.s.importarOntem();
      this.logger.log(`Conciliação Stone diária (${r.referenceDate}): ${r.status}, ${r.quantidade} transações.`);
    } catch (e) {
      this.logger.error(`Job conciliação Stone falhou: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}
