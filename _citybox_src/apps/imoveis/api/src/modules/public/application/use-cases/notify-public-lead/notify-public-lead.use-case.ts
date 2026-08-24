import { Injectable, Logger } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { LeadEntity } from '../../../../leads/domain/entities/lead.entity';
import type { TeamMemberEntity } from '../../../../settings/domain/entities/team-member.entity';
import { DEFAULT_NOTIFICATION_SETTINGS } from '../../../../settings/domain/entities/store-settings.entity';
import { StoreSettingsRepository } from '../../../../settings/domain/repositories/store-settings.repository.interface';
import { PublicLeadMailer } from '../../ports/public-lead-mailer.port';

export type NotifyPublicLeadInput = {
  storeId: string;
  agent: TeamMemberEntity;
  lead: LeadEntity;
  message?: string;
  propertyName?: string | null;
};

/**
 * Notifica o corretor por e-mail após lead do catálogo.
 * Falhas de envio são engolidas (log) — o lead já foi criado.
 */
@Injectable()
export class NotifyPublicLeadUseCase implements IUseCase<
  NotifyPublicLeadInput,
  void
> {
  private readonly logger = new Logger(NotifyPublicLeadUseCase.name);

  constructor(
    private readonly storeSettings: StoreSettingsRepository,
    private readonly mailer: PublicLeadMailer,
  ) {}

  async execute(input: NotifyPublicLeadInput): Promise<void> {
    try {
      await this.notify(input);
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown_error';
      this.logger.error(
        `public_lead_notify_failed leadId=${input.lead.id} reason=${reason}`,
      );
    }
  }

  private async notify(input: NotifyPublicLeadInput): Promise<void> {
    const settings = await this.storeSettings.findByStoreId(input.storeId);
    const notifications =
      settings?.notifications ?? DEFAULT_NOTIFICATION_SETTINGS;

    if (!notifications.emailEnabled || !notifications.leadsAlerts) {
      this.logger.debug(
        `public_lead_email_skipped flags leadId=${input.lead.id} emailEnabled=${notifications.emailEnabled} leadsAlerts=${notifications.leadsAlerts}`,
      );
      return;
    }

    const recipients = resolveLeadNotifyRecipients(input.agent.email);
    if (recipients.length === 0) {
      this.logger.warn(
        `public_lead_email_skipped_no_recipient leadId=${input.lead.id} agentId=${input.agent.agentId}`,
      );
      return;
    }

    const base = {
      agentName: input.agent.name,
      leadId: input.lead.id,
      leadName: input.lead.name,
      leadPhone: input.lead.phone || undefined,
      leadEmail: input.lead.email || undefined,
      message: input.message?.trim() || undefined,
      propertyName: input.propertyName?.trim() || undefined,
      agentSlug: input.agent.agentId,
      storeId: input.storeId,
    };

    for (const to of recipients) {
      await this.mailer.sendLeadAlert({ ...base, to });
    }
  }
}

/**
 * E-mail do membro da equipe + extras:
 * - `LEADS_NOTIFY_EMAIL` (CSV)
 * - em dev, `AUTH_DEV_EMAIL` se ainda não houver destinatário
 */
export function resolveLeadNotifyRecipients(
  agentEmail: string,
  env: NodeJS.ProcessEnv = process.env,
): string[] {
  const extras =
    env.LEADS_NOTIFY_EMAIL?.split(',')
      .map((part) => part.trim())
      .filter((part) => part.includes('@')) ?? [];

  const primary = agentEmail.trim();
  const list = [...(primary.includes('@') ? [primary] : []), ...extras];

  const unique = [...new Set(list.map((email) => email.toLowerCase()))];

  if (unique.length === 0) {
    const devEmail = env.AUTH_DEV_EMAIL?.trim();
    if (devEmail?.includes('@') && env.NODE_ENV !== 'production') {
      return [devEmail.toLowerCase()];
    }
  }

  return unique;
}
