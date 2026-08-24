import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OutboxRelayService } from '../messaging/outbox-relay.service';
import { Public } from './decorators/public.decorator';

/** Acima disto o outbox está represado — sinaliza broker fora do ar ou relay parado. */
const OUTBOX_LAG_ALERT_SECONDS = 120;

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly outboxRelay: OutboxRelayService) {}

  @Public()
  @Get()
  liveness() {
    return { ok: true, service: 'admin-api', version: '0.1.0' };
  }

  /**
   * Readiness inclui a saúde do outbox: evento represado significa vertical não
   * provisionada (ou suspensão não propagada), e antes da Fase 1 isso era invisível.
   */
  @Public()
  @Get('ready')
  async readiness() {
    const outbox = await this.outboxRelay.stats().catch(() => null);
    const lagging =
      outbox !== null &&
      outbox.oldestPendingAgeSeconds !== null &&
      outbox.oldestPendingAgeSeconds > OUTBOX_LAG_ALERT_SECONDS;

    return {
      ok: true,
      ready: true,
      service: 'admin-api',
      outbox: outbox
        ? { ...outbox, lagging, failedNeedsAttention: outbox.failed > 0 }
        : { error: 'indisponível' },
    };
  }
}
