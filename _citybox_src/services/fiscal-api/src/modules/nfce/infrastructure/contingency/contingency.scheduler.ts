import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { TransmitPendingNfceUseCase } from '../../application/use-cases/transmit-pending-nfce/transmit-pending-nfce.use-case';
import { AlertOverdueContingencyUseCase } from '../../application/use-cases/alert-overdue-contingency/alert-overdue-contingency.use-case';
import { ContingencyQueueRepository } from '../../domain/contingency/contingency-queue.repository';

const DEFAULT_INTERVAL_SECONDS = 120;

/// Agendador do dreno de contingência (T053).
///
/// ⚠️ **DESLIGADO por padrão**, ligado por `NFCE_CONTINGENCY_DRAIN=on`.
///
/// Não é timidez: enquanto a emissão em contingência não estiver validada
/// contra a SEFAZ de homologação, um dreno automático transmitiria cupons
/// montados por código nunca exercitado contra o órgão. Ligar depois é uma
/// variável de ambiente; desfazer transmissão indevida não é.
///
/// ⚠️⚠️ **Limitação conhecida: uma instância só.**
///
/// `setInterval` roda em **todo** processo da API. Com mais de uma réplica, os
/// dreno concorrentes podem ler a mesma entrada `PENDING` e transmiti-la duas
/// vezes — e duplicidade na SEFAZ é rejeição (`cStat` 204) sobre um cupom que
/// o consumidor já levou.
///
/// A defesa correta é uma reivindicação atômica no banco
/// (`UPDATE ... WHERE status='PENDING' ... RETURNING`), que a fila ainda não
/// tem. Enquanto não tiver, este agendador só é seguro com **uma** instância —
/// daí ele nascer desligado, e não com um padrão que pareça inofensivo.
///
/// Também não se usou `@nestjs/schedule`: a dependência não está no projeto, e
/// acrescentá-la resolveria a sintaxe do cron sem resolver a concorrência, que
/// é o problema real.
@Injectable()
export class ContingencyScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ContingencyScheduler.name);
  private timer: NodeJS.Timeout | null = null;
  /// Impede sobreposição de ciclos no MESMO processo: um dreno lento não pode
  /// ver o próximo tick entrar por cima dele.
  private running = false;

  constructor(
    private readonly transmitPending: TransmitPendingNfceUseCase,
    private readonly alertOverdue: AlertOverdueContingencyUseCase,
    private readonly queue: ContingencyQueueRepository,
  ) {}

  onModuleInit(): void {
    if (process.env.NFCE_CONTINGENCY_DRAIN !== 'on') {
      this.logger.log(
        'Dreno de contingência desligado. Ligue com NFCE_CONTINGENCY_DRAIN=on — ' +
          'apenas com UMA instância da API, até a fila ter reivindicação atômica.',
      );
      return;
    }

    const seconds = this.intervalSeconds();
    this.logger.warn(
      `Dreno de contingência LIGADO, a cada ${seconds}s. ` +
        'Confirme que só há uma instância da API em execução.',
    );

    this.timer = setInterval(() => void this.tick(), seconds * 1000);
    // Não segura o processo vivo: um agendador não deve impedir o encerramento
    // limpo da API.
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  /// Exposto para teste: exercitar o ciclo sem esperar o relógio.
  async tick(): Promise<void> {
    if (this.running) return;
    this.running = true;

    try {
      // O alarme roda ANTES do dreno, e sempre. Se rodasse depois, um dreno
      // que falhasse adiaria a visibilidade do problema fiscal para o próximo
      // ciclo — e é justamente quando a SEFAZ está instável que o alarme mais
      // importa.
      await this.alertOverdue.execute();

      for (const companyId of await this.companiesWithPending()) {
        await this.transmitPending.execute({ companyId });
      }
    } catch (error: unknown) {
      // Um ciclo que estoura não pode derrubar o agendador: sem este catch, a
      // exceção sobe para o `setInterval` e o dreno morre em silêncio,
      // deixando a fila parada sem ninguém perceber.
      this.logger.error(
        `Ciclo do dreno de contingência falhou: ${
          error instanceof Error ? error.message : 'erro desconhecido'
        }`,
      );
    } finally {
      this.running = false;
    }
  }

  private intervalSeconds(): number {
    const configured = Number(process.env.NFCE_CONTINGENCY_DRAIN_SECONDS);
    return Number.isFinite(configured) && configured > 0
      ? configured
      : DEFAULT_INTERVAL_SECONDS;
  }

  /// Emitentes com fila pendente.
  ///
  /// Derivado da própria fila em vez de varrer o cadastro de empresas: sem
  /// contingência acontecendo, o ciclo não toca em nada.
  private async companiesWithPending(): Promise<string[]> {
    // `findOverdue` com limiar no futuro devolve todos os pendentes — não há
    // método "listar Emitentes com pendência" na porta, e acrescentar um só
    // para isto ampliaria a interface sem ganho.
    const entries = await this.queue.findOverdue(
      new Date(Date.now() + 365 * 24 * 3_600_000),
      500,
    );
    return [...new Set(entries.map((entry) => entry.companyId))];
  }
}
