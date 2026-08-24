import { Injectable, Logger } from '@nestjs/common';
import {
  PublicLeadMailer,
  type PublicLeadEmailPayload,
} from '../../application/ports/public-lead-mailer.port';
import { buildPublicLeadEmailContent } from './build-public-lead-email';

/**
 * Stub de dev/testes: NÃO envia e-mail real.
 * Configure `SMTP_HOST` + `SMTP_FROM` (+ auth) no `.env` da imoveis-api.
 */
@Injectable()
export class LoggingPublicLeadMailer extends PublicLeadMailer {
  private readonly logger = new Logger(LoggingPublicLeadMailer.name);
  private warnedOnce = false;

  async sendLeadAlert(
    payload: PublicLeadEmailPayload,
  ): Promise<PublicLeadEmailPayload> {
    if (!this.warnedOnce) {
      this.warnedOnce = true;
      this.logger.warn(
        'E-mail de lead NÃO é enviado de verdade: SMTP não configurado. ' +
          'Defina SMTP_HOST, SMTP_FROM, SMTP_USER e SMTP_PASS em apps/imoveis/api/.env e reinicie a API.',
      );
    }

    const content = buildPublicLeadEmailContent(payload);
    this.logger.warn(
      `public_lead_email_stub (não entregue) ${JSON.stringify({
        to: payload.to,
        subject: content.subject,
        leadId: payload.leadId,
        agentSlug: payload.agentSlug,
        storeId: payload.storeId,
      })}`,
    );
    return payload;
  }
}
