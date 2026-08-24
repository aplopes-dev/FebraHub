import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { type Transporter } from 'nodemailer';
import {
  PublicLeadMailer,
  type PublicLeadEmailPayload,
} from '../../application/ports/public-lead-mailer.port';
import { buildPublicLeadEmailContent } from './build-public-lead-email';
import { resolveSmtpMailEnv, type SmtpMailEnv } from './resolve-smtp-mail-env';

@Injectable()
export class SmtpPublicLeadMailer extends PublicLeadMailer {
  private readonly logger = new Logger(SmtpPublicLeadMailer.name);
  private transporter: Transporter | null = null;

  constructor(private readonly createTransport = nodemailer.createTransport) {
    super();
  }

  async sendLeadAlert(
    payload: PublicLeadEmailPayload,
  ): Promise<PublicLeadEmailPayload> {
    const smtp = resolveSmtpMailEnv();
    if (!smtp) {
      throw new Error('SMTP_HOST is required to send public lead e-mails');
    }

    const content = buildPublicLeadEmailContent(payload);
    const from =
      smtp.fromName != null && smtp.fromName.length > 0
        ? `"${smtp.fromName}" <${smtp.from}>`
        : smtp.from;

    try {
      const transporter = this.getTransporter(smtp);
      const info = await transporter.sendMail({
        from,
        to: payload.to,
        subject: content.subject,
        text: content.text,
        html: content.html,
        replyTo: payload.leadEmail || undefined,
      });
      this.logger.log(
        `public_lead_email_sent ${JSON.stringify({
          to: payload.to,
          leadId: payload.leadId,
          messageId: info.messageId,
        })}`,
      );
      return payload;
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'unknown_smtp_error';
      this.logger.error(
        `public_lead_email_failed leadId=${payload.leadId} reason=${reason}`,
      );
      throw error;
    }
  }

  private getTransporter(smtp: SmtpMailEnv): Transporter {
    if (!this.transporter) {
      this.transporter = this.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        auth:
          smtp.user && smtp.pass
            ? { user: smtp.user, pass: smtp.pass }
            : undefined,
      });
    }
    return this.transporter;
  }
}
