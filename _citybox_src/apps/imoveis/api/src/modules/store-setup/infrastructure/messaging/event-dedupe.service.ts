import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';

/**
 * Dedupe de eventos consumidos da plataforma.
 *
 * O outbox do admin-api entrega **at-least-once**. Sem esta trava, um
 * `store.created` reentregue tentaria provisionar de novo.
 *
 * O registro é gravado **antes** do processamento e removido se o handler
 * falhar — assim uma falha transitória volta pela fila.
 */
@Injectable()
export class EventDedupeService {
  private readonly logger = new Logger(EventDedupeService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Retorna `false` quando o evento já foi processado antes. */
  async claim(
    eventId: string,
    type: string,
    aggregateId: string,
  ): Promise<boolean> {
    try {
      await this.prisma.processedEvent.create({
        data: { eventId, type, aggregateId },
      });
      return true;
    } catch (err) {
      if (isUniqueViolation(err)) {
        this.logger.log(
          `Evento ${eventId} (${type}) já processado — ignorando`,
        );
        return false;
      }
      throw err;
    }
  }

  async release(eventId: string): Promise<void> {
    await this.prisma.processedEvent
      .delete({ where: { eventId } })
      .catch(() => undefined);
  }
}

function isUniqueViolation(err: unknown): boolean {
  const code = (err as { code?: string })?.code;
  return code === 'P2002';
}
