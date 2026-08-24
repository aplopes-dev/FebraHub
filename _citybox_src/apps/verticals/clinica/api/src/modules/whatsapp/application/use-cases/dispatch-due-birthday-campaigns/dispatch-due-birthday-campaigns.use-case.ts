import { Injectable, Logger } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ClinicStoreProfileRepository } from '../../../../clinic-profile/domain/repositories/clinic-store-profile.repository.interface';
import {
  birthdayCampaignCorrelationPrefix,
  birthdayMessageCorrelationId,
  parseAniversarioContent,
  type AniversarioContent,
} from '../../../../marketing/campaigns/domain/content/aniversario.content';
import type { Campaign } from '../../../../marketing/campaigns/domain/entities/campaign.entity';
import { CampaignRepository } from '../../../../marketing/campaigns/domain/repositories/campaign.repository';
import { brazilCivilYmd } from '../../../../marketing/campaigns/domain/utils/campaign-period.utils';
import { WhatsappMessage } from '../../../domain/entities/whatsapp-message.entity';
import { BirthdayCampaignPatientRepository } from '../../../domain/repositories/birthday-campaign-patient.repository.interface';
import { WhatsappConnectionRepository } from '../../../domain/repositories/whatsapp-connection.repository.interface';
import { WhatsappMessageRepository } from '../../../domain/repositories/whatsapp-message.repository.interface';
import { toWhatsappE164 } from '../../../domain/utils/phone-e164';
import { renderWhatsappTemplate } from '../../../domain/utils/render-template';
import { WhatsappEventPublisher } from '../../services/whatsapp-event-publisher';

/** Intervalo entre envios de aniversário (anti-ban WhatsApp). */
export const BIRTHDAY_SEND_INTERVAL_MS = 5 * 60 * 1000;

export type DispatchDueBirthdayCampaignsInput = {
  now?: Date;
  /** Se informado, processa só esta loja. */
  storeId?: string;
  /** Se informado, processa só esta campanha (ainda precisa estar active + aniversario). */
  campaignId?: string;
  softFail?: boolean;
};

export type DispatchDueBirthdayCampaignsResult = {
  scannedCampaigns: number;
  enqueued: number;
  skipped: number;
};

@Injectable()
export class DispatchDueBirthdayCampaignsUseCase implements IUseCase<
  DispatchDueBirthdayCampaignsInput,
  DispatchDueBirthdayCampaignsResult
> {
  private readonly logger = new Logger(DispatchDueBirthdayCampaignsUseCase.name);

  constructor(
    private readonly campaigns: CampaignRepository,
    private readonly connectionRepository: WhatsappConnectionRepository,
    private readonly messageRepository: WhatsappMessageRepository,
    private readonly birthdayPatients: BirthdayCampaignPatientRepository,
    private readonly clinicProfileRepository: ClinicStoreProfileRepository,
    private readonly publisher: WhatsappEventPublisher,
  ) {}

  async execute(
    input: DispatchDueBirthdayCampaignsInput = {},
  ): Promise<DispatchDueBirthdayCampaignsResult> {
    try {
      return await this.dispatch(input);
    } catch (err) {
      if (input.softFail) {
        this.logger.warn(
          `Birthday dispatch skipped: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
        return { scannedCampaigns: 0, enqueued: 0, skipped: 0 };
      }
      throw err;
    }
  }

  private async dispatch(
    input: DispatchDueBirthdayCampaignsInput,
  ): Promise<DispatchDueBirthdayCampaignsResult> {
    const now = input.now ?? new Date();
    if (!isAtOrAfterBrazilSevenAm(now)) {
      return { scannedCampaigns: 0, enqueued: 0, skipped: 0 };
    }

    const civilYmd = formatBrazilCivilYmd(now);

    let campaigns = await this.campaigns.findActiveByType(
      'aniversario',
      input.storeId,
    );
    if (input.campaignId) {
      campaigns = campaigns.filter((c) => c.id === input.campaignId);
    }

    let enqueued = 0;
    let skipped = 0;

    for (const campaign of campaigns) {
      const outcome = await this.dispatchCampaign(campaign, civilYmd, now);
      enqueued += outcome.enqueued;
      skipped += outcome.skipped;
    }

    if (enqueued > 0) {
      this.logger.log(
        `Birthday messages enqueued=${enqueued} skipped=${skipped} campaigns=${campaigns.length} date=${civilYmd}`,
      );
    }

    return {
      scannedCampaigns: campaigns.length,
      enqueued,
      skipped,
    };
  }

  private async dispatchCampaign(
    campaign: Campaign,
    civilYmd: string,
    now: Date,
  ): Promise<{ enqueued: number; skipped: number }> {
    const connection = await this.connectionRepository.findByStoreId(
      campaign.storeId,
    );
    if (!connection || connection.status !== 'connected') {
      return { enqueued: 0, skipped: 1 };
    }

    let content: AniversarioContent;
    try {
      content = parseAniversarioContent(
        campaign.content,
        DispatchDueBirthdayCampaignsUseCase.name,
      );
    } catch {
      this.logger.warn(
        `Invalid aniversario content campaignId=${campaign.id}; skipping`,
      );
      return { enqueued: 0, skipped: 1 };
    }

    const prefix = birthdayCampaignCorrelationPrefix(campaign.id);
    const latest = await this.messageRepository.findLatestByCorrelationIdPrefix(
      campaign.storeId,
      prefix,
    );
    if (
      latest &&
      now.getTime() - latest.createdAt.getTime() < BIRTHDAY_SEND_INTERVAL_MS
    ) {
      return { enqueued: 0, skipped: 0 };
    }

    const patients = await this.birthdayPatients.findBirthdayPatients(
      campaign.storeId,
      civilYmd,
      {
        planIds: content.planIds,
        specialtyIds: content.specialtyIds,
        genders: content.genders,
      },
    );

    const profile = await this.clinicProfileRepository.findByStoreId(
      campaign.storeId,
    );
    const clinicName =
      profile?.communicationsName?.trim() ||
      profile?.clinicName?.trim() ||
      'clínica';
    const clinicPhone = profile?.mobile?.trim() || profile?.phone?.trim() || '';

    // Ordem estável (nome ASC) — 1 envio por tick, espaçado 5 min do anterior.
    for (const patient of patients) {
      const correlationId = birthdayMessageCorrelationId(
        campaign.id,
        patient.id,
        civilYmd,
      );
      const already = await this.messageRepository.existsByCorrelationId(
        campaign.storeId,
        correlationId,
      );
      if (already) {
        continue;
      }

      const phone =
        toWhatsappE164(patient.phone) ?? toWhatsappE164(patient.guardianPhone);
      if (!phone) {
        continue;
      }

      const body = renderWhatsappTemplate(content.messageBody, {
        nome_paciente: patient.name,
        nome_clinica: clinicName,
        telefone_clinica: clinicPhone,
      });

      const message = WhatsappMessage.create({
        storeId: campaign.storeId,
        patientId: patient.id,
        appointmentId: null,
        direction: 'outbound',
        body,
        toE164: phone,
        status: 'queued',
        templateKey: 'birthday',
        correlationId,
        expiresAt: null,
        createdAt: now,
        updatedAt: now,
      });

      const saved = await this.messageRepository.save(message);
      await this.publisher.publishSend({
        storeId: campaign.storeId,
        messageId: saved.id,
      });

      await this.campaigns.save(
        campaign.withCounters({ views: campaign.views + 1 }),
      );

      return { enqueued: 1, skipped: 0 };
    }

    return { enqueued: 0, skipped: 0 };
  }
}

export function formatBrazilCivilYmd(now: Date): string {
  const { y, m, d } = brazilCivilYmd(now);
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** True quando o wall-clock BRT está em 07:00 (minuto 0). */
export function isBrazilSevenAmMinute(now: Date): boolean {
  const shifted = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  return shifted.getUTCHours() === 7 && shifted.getUTCMinutes() === 0;
}

/** True a partir de 07:00 BRT (inclusive) no dia civil atual. */
export function isAtOrAfterBrazilSevenAm(now: Date): boolean {
  const shifted = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  return shifted.getUTCHours() >= 7;
}

/**
 * Quantos envios de aniversário já poderiam ter saído hoje (BRT),
 * contando 1 a cada 5 min a partir das 07:00.
 * 07:00 → 1, 07:05 → 2, 07:10 → 3, …; antes de 07:00 → 0.
 */
export function birthdaySendSlotsAvailable(now: Date): number {
  const shifted = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const hour = shifted.getUTCHours();
  const minute = shifted.getUTCMinutes();
  if (hour < 7) return 0;
  const minutesSinceSeven = (hour - 7) * 60 + minute;
  return Math.floor(minutesSinceSeven / 5) + 1;
}
