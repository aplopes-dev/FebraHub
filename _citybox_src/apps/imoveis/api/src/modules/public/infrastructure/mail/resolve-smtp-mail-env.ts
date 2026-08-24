export type SmtpMailEnv = {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from: string;
  fromName?: string;
};

/**
 * Lê `SMTP_*` do processo. Retorna `null` se `SMTP_HOST` estiver ausente.
 * Exige `SMTP_FROM` quando o host está definido.
 */
export function resolveSmtpMailEnv(
  env: NodeJS.ProcessEnv = process.env,
): SmtpMailEnv | null {
  const host = env.SMTP_HOST?.trim();
  if (!host) return null;

  const port = Number.parseInt(env.SMTP_PORT?.trim() || '465', 10);
  const secure =
    env.SMTP_SECURE?.trim().toLowerCase() === 'true' ||
    (!env.SMTP_SECURE && port === 465);
  const from = env.SMTP_FROM?.trim();
  if (!from) {
    throw new Error(
      'SMTP_FROM is required when SMTP_HOST is set (public lead mailer)',
    );
  }

  return {
    host,
    port: Number.isFinite(port) ? port : 465,
    secure,
    user: env.SMTP_USER?.trim() || undefined,
    pass: env.SMTP_PASS?.trim() || undefined,
    from,
    fromName: env.SMTP_FROM_NAME?.trim() || undefined,
  };
}
