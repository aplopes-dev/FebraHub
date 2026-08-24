import { Logger } from '@nestjs/common';
import { PublicLeadMailer } from '../../application/ports/public-lead-mailer.port';
import { LoggingPublicLeadMailer } from './logging-public-lead-mailer';
import { resolveSmtpMailEnv } from './resolve-smtp-mail-env';
import { SmtpPublicLeadMailer } from './smtp-public-lead-mailer';

const logger = new Logger('PublicLeadMailer');

function smtpConfigured(): boolean {
  try {
    return resolveSmtpMailEnv() != null;
  } catch {
    return Boolean(process.env.SMTP_HOST?.trim());
  }
}

/**
 * Prefer SMTP quando `SMTP_HOST` está definido.
 * Stub de log só fora de produção / `MAIL_TRANSPORT=log`.
 */
export function createPublicLeadMailer(): PublicLeadMailer {
  const transport = process.env.MAIL_TRANSPORT?.trim().toLowerCase();
  if (transport === 'log') {
    logger.warn(
      'PublicLeadMailer=log (stub) — e-mails de lead não saem da API. Remova MAIL_TRANSPORT=log e configure SMTP_*.',
    );
    return new LoggingPublicLeadMailer();
  }
  if (transport === 'smtp' || smtpConfigured()) {
    logger.log('PublicLeadMailer=smtp');
    return new SmtpPublicLeadMailer();
  }
  if (process.env.NODE_ENV === 'production') {
    logger.warn(
      'PublicLeadMailer=smtp (produção) — defina SMTP_HOST e SMTP_FROM ou os envios falharão.',
    );
    return new SmtpPublicLeadMailer();
  }
  logger.warn(
    'PublicLeadMailer=log (stub) — defina SMTP_HOST, SMTP_FROM, SMTP_USER e SMTP_PASS em apps/imoveis/api/.env para enviar e-mails reais.',
  );
  return new LoggingPublicLeadMailer();
}
