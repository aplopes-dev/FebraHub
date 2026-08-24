import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { APPOINTMENT_REMINDER_POLL_MS } from '../../domain/whatsapp.types';
import { DispatchDueAppointmentRemindersUseCase } from '../../application/use-cases/dispatch-due-appointment-reminders/dispatch-due-appointment-reminders.use-case';

/**
 * No processo `main-whatsapp`, varre a cada minuto:
 * - consultas `confirmed` na janela T-2h
 * - consultas `scheduled` (sem reply 1/2, mas com pedido de confirmação) na janela T-5min
 */
@Injectable()
export class AppointmentReminderScheduler
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(AppointmentReminderScheduler.name);
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(
    private readonly dispatchReminders: DispatchDueAppointmentRemindersUseCase,
  ) {}

  onModuleInit(): void {
    if (process.env.CLINIC_WHATSAPP_ENABLED === 'false') {
      this.logger.warn(
        'Reminder scheduler disabled (CLINIC_WHATSAPP_ENABLED=false)',
      );
      return;
    }
    void this.tick();
    this.timer = setInterval(() => {
      void this.tick();
    }, APPOINTMENT_REMINDER_POLL_MS);
    this.logger.log(
      `Reminder scheduler started (every ${APPOINTMENT_REMINDER_POLL_MS / 1000}s; confirmed T-2h, pending T-5min)`,
    );
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async tick(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      await this.dispatchReminders.execute({});
    } catch (err) {
      this.logger.error(
        `Reminder tick failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    } finally {
      this.running = false;
    }
  }
}
