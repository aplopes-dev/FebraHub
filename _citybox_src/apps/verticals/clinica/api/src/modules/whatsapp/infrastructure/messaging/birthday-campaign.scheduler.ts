import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { APPOINTMENT_REMINDER_POLL_MS } from '../../domain/whatsapp.types';
import {
  DispatchDueBirthdayCampaignsUseCase,
  isAtOrAfterBrazilSevenAm,
} from '../../application/use-cases/dispatch-due-birthday-campaigns/dispatch-due-birthday-campaigns.use-case';

/**
 * No processo `main-whatsapp`, a cada ~60s (a partir das 07:00 BRT)
 * libera o próximo slot de aniversário (1 envio a cada 5 minutos).
 */
@Injectable()
export class BirthdayCampaignScheduler
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(BirthdayCampaignScheduler.name);
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(
    private readonly dispatchBirthdayCampaigns: DispatchDueBirthdayCampaignsUseCase,
  ) {}

  onModuleInit(): void {
    if (process.env.CLINIC_WHATSAPP_ENABLED === 'false') {
      this.logger.warn(
        'Birthday campaign scheduler disabled (CLINIC_WHATSAPP_ENABLED=false)',
      );
      return;
    }
    void this.tick();
    this.timer = setInterval(() => {
      void this.tick();
    }, APPOINTMENT_REMINDER_POLL_MS);
    this.logger.log(
      `Birthday campaign scheduler started (every ${APPOINTMENT_REMINDER_POLL_MS / 1000}s; 1 send / 5min from 07:00 BRT)`,
    );
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.timer = null;
  }

  private async tick(now = new Date()): Promise<void> {
    if (this.running) return;
    if (!isAtOrAfterBrazilSevenAm(now)) return;

    this.running = true;
    try {
      await this.dispatchBirthdayCampaigns.execute({ now, softFail: true });
    } catch (err) {
      this.logger.error(
        `Birthday campaign tick failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    } finally {
      this.running = false;
    }
  }
}
