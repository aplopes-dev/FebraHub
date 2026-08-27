import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CentralVendasService } from './central-vendas.service';

/**
 * Sincronização automática da Central de Vendas (PRD §8). Roda às 06:30 (após o
 * cron da conciliação Stone às 06:00 ter baixado o arquivo do dia anterior):
 * reingere as 3 origens dos últimos 30 dias e reconcilia. Best-effort e
 * idempotente — nunca duplica venda nem derruba o processo.
 */
@Injectable()
export class CentralVendasCron {
  private readonly logger = new Logger(CentralVendasCron.name);

  constructor(private readonly s: CentralVendasService) {}

  @Cron('30 6 * * *', { name: 'central-vendas-reconciliacao' })
  async diaria(): Promise<void> {
    try {
      const usuarioSistema = { id: undefined, nome: 'sistema' } as never;
      const r = await this.s.ressincronizar(usuarioSistema);
      this.logger.log(`Central de Vendas: reconciliação diária — ${r.reconciliacao.vinculadas} vínculos, ${r.reconciliacao.criadas} consolidadas.`);
    } catch (e) {
      this.logger.error(`Reconciliação diária falhou: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}
