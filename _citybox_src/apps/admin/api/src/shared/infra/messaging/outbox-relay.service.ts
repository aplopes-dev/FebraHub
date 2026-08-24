import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { RabbitBus, type RabbitConfig } from '@citybox/messaging';
import { PrismaService } from '../prisma/prisma.service';

/** Linha reivindicada pelo relay para publicação. */
type ClaimedRow = {
  id: string;
  type: string;
  routing_key: string;
  payload: unknown;
  attempts: number;
};

const POLL_INTERVAL_MS = Number(process.env.OUTBOX_POLL_INTERVAL_MS ?? 2000);
const BATCH_SIZE = Number(process.env.OUTBOX_BATCH_SIZE ?? 50);
/** Depois disto a linha vira FAILED e para de ser tentada — exige intervenção. */
const MAX_ATTEMPTS = Number(process.env.OUTBOX_MAX_ATTEMPTS ?? 10);
/**
 * Janela em que uma linha reivindicada fica invisível para outros ciclos/réplicas.
 * Precisa ser maior que o tempo de um publish, senão a mesma linha é publicada duas vezes.
 */
const LEASE_SECONDS = Number(process.env.OUTBOX_LEASE_SECONDS ?? 30);
const BACKOFF_BASE_MS = 5_000;
const BACKOFF_CAP_MS = 5 * 60_000;

/**
 * Relay do outbox: lê `platform.outbox_events` PENDING e publica no RabbitMQ.
 *
 * Fluxo em três passos, de propósito:
 *  1. **Claim** — uma transação curta marca o lote como invisível por `LEASE_SECONDS`
 *     (`FOR UPDATE SKIP LOCKED` + empurra `available_at`) e commita na hora.
 *  2. **Publish** — acontece FORA de qualquer transação.
 *  3. **Mark** — cada linha é marcada individualmente (PUBLISHED, ou falha com backoff).
 *
 * Publicar dentro da transação parece mais simples e está errado: I/O de rede segurando
 * lock de banco esgota o pool, e se o UPDATE final falhar a transação aborta **depois**
 * do publish — a linha volta a PENDING e é republicada a cada ciclo, em loop. Foi
 * exatamente o que aconteceu na primeira versão desta classe (31 duplicatas em ~1min).
 *
 * Garantia: **at-least-once**. Crash entre publish e mark republica a linha depois do
 * lease. Todo consumidor tem de ser idempotente pelo `eventId` do CloudEvent — que é o
 * que a coluna `event_id` carrega.
 */
@Injectable()
export class OutboxRelayService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(OutboxRelayService.name);
  private bus: RabbitBus | null = null;
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private stopped = false;

  constructor(private readonly prisma: PrismaService) {}

  private config(): RabbitConfig | null {
    const url = process.env.RABBITMQ_URL?.trim();
    if (!url) return null;
    return {
      url,
      exchange: process.env.RABBITMQ_EXCHANGE ?? 'citybox.events',
      dlx: process.env.RABBITMQ_DLX ?? 'citybox.dlx',
    };
  }

  async onModuleInit(): Promise<void> {
    if (process.env.OUTBOX_RELAY_ENABLED === 'false') {
      this.logger.warn(
        'OUTBOX_RELAY_ENABLED=false — eventos acumulam em outbox_events sem publicar',
      );
      return;
    }

    const cfg = this.config();
    if (!cfg) {
      // Diferente do publisher antigo (que retornava em silêncio): erro visível, e os
      // eventos ficam PENDING no outbox — recuperáveis quando a config chegar.
      this.logger.error(
        'RABBITMQ_URL ausente — relay NÃO vai publicar. Eventos ficam PENDING (não são perdidos).',
      );
      return;
    }

    this.bus = new RabbitBus(cfg);
    try {
      await this.bus.connect();
    } catch (err) {
      // Não derruba o boot — o relay volta a tentar no próximo ciclo.
      this.logger.error(
        `Falha ao conectar no RabbitMQ: ${asMessage(err)}. Relay segue tentando.`,
      );
    }
    this.schedule();
  }

  onApplicationShutdown(): void {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    void this.bus?.close();
  }

  private schedule(): void {
    if (this.stopped) return;
    this.timer = setTimeout(() => {
      void this.tick().finally(() => this.schedule());
    }, POLL_INTERVAL_MS);
  }

  /** Exposto para teste — processa um lote e devolve quantos publicou. */
  async tick(): Promise<number> {
    if (this.running || this.stopped || !this.bus) return 0;
    this.running = true;
    try {
      const claimed = await this.claimBatch();
      if (claimed.length === 0) return 0;

      let published = 0;
      for (const row of claimed) {
        if (await this.publishAndMark(row)) published += 1;
      }
      if (published > 0) {
        this.logger.log(`Outbox: ${published}/${claimed.length} publicado(s)`);
      }
      return published;
    } catch (err) {
      this.logger.error(`Ciclo do relay falhou: ${asMessage(err)}`);
      return 0;
    } finally {
      this.running = false;
    }
  }

  /**
   * Reivindica um lote numa transação curta. `available_at` é empurrado para frente, o
   * que serve de lease: outra réplica (ou o próximo ciclo) não pega a mesma linha.
   */
  private async claimBatch(): Promise<ClaimedRow[]> {
    return this.prisma.$queryRaw<ClaimedRow[]>`
      UPDATE platform.outbox_events
      SET available_at = now() + make_interval(secs => ${LEASE_SECONDS}),
          updated_at = now()
      WHERE id IN (
        SELECT id FROM platform.outbox_events
        WHERE status = 'PENDING' AND available_at <= now()
        ORDER BY occurred_at
        LIMIT ${BATCH_SIZE}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id, type, routing_key, payload, attempts
    `;
  }

  /** Publica fora de transação e marca o resultado. Devolve true se publicou. */
  private async publishAndMark(row: ClaimedRow): Promise<boolean> {
    try {
      await this.bus!.publish(
        row.routing_key,
        Buffer.from(JSON.stringify(row.payload)),
      );
    } catch (err) {
      await this.markFailure(row, asMessage(err));
      return false;
    }

    try {
      // Prisma tipado em vez de SQL cru: a primeira versão usava `id = ${id}::uuid`,
      // mas a coluna é `text` (Prisma `String @id`), e o cast quebrava todo o ciclo.
      await this.prisma.outboxEvent.update({
        where: { id: row.id },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
          lastError: null,
        },
      });
      return true;
    } catch (err) {
      // Publicou mas não conseguiu marcar: o lease expira e a linha é republicada.
      // É o caso at-least-once — precisa aparecer no log para não parecer sucesso.
      this.logger.error(
        `Outbox ${row.id} publicado mas NÃO marcado (${asMessage(err)}) — será republicado após o lease de ${LEASE_SECONDS}s`,
      );
      return true;
    }
  }

  private async markFailure(row: ClaimedRow, message: string): Promise<void> {
    const attempts = row.attempts + 1;
    const exhausted = attempts >= MAX_ATTEMPTS;
    const delayMs = Math.min(
      BACKOFF_BASE_MS * 2 ** (attempts - 1),
      BACKOFF_CAP_MS,
    );

    if (exhausted) {
      this.logger.error(
        `Outbox ${row.id} (${row.type}) esgotou ${MAX_ATTEMPTS} tentativas — FAILED: ${message}`,
      );
    } else {
      this.logger.warn(
        `Outbox ${row.id} (${row.type}) falhou (tentativa ${attempts}), retry em ${Math.round(delayMs / 1000)}s: ${message}`,
      );
    }

    try {
      await this.prisma.outboxEvent.update({
        where: { id: row.id },
        data: {
          attempts,
          lastError: message.slice(0, 1000),
          status: exhausted ? 'FAILED' : 'PENDING',
          availableAt: new Date(Date.now() + delayMs),
        },
      });
    } catch (err) {
      this.logger.error(
        `Não foi possível registrar a falha do outbox ${row.id}: ${asMessage(err)}`,
      );
    }
  }

  /** Saúde do outbox — consumido por `/api/health/ready`. */
  async stats(): Promise<{
    pending: number;
    failed: number;
    oldestPendingAgeSeconds: number | null;
  }> {
    const [pending, failed, oldest] = await Promise.all([
      this.prisma.outboxEvent.count({ where: { status: 'PENDING' } }),
      this.prisma.outboxEvent.count({ where: { status: 'FAILED' } }),
      this.prisma.outboxEvent.findFirst({
        where: { status: 'PENDING' },
        orderBy: { occurredAt: 'asc' },
        select: { occurredAt: true },
      }),
    ]);

    return {
      pending,
      failed,
      oldestPendingAgeSeconds: oldest
        ? Math.round((Date.now() - oldest.occurredAt.getTime()) / 1000)
        : null,
    };
  }
}

function asMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
