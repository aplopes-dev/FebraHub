import { InfrastructureError } from '../../../core/errors/infrastructure.error';

/// Mapeia para 503 via `AppExceptionFilter` (nome contém "Unavailable").
///
/// Carrega `statusCode` e um trecho do corpo na mensagem interna de propósito:
/// a versão anterior deste diagnóstico na SEFAZ dizia apenas "[object Object]"
/// e custou horas de investigação. Uma falha de transporte sem o que o
/// servidor respondeu não é diagnosticável.
export class SefinUnavailableError extends InfrastructureError {
  constructor(context: string, endpoint: string, cause: unknown) {
    super({
      internalMessage: `Falha de comunicação com o Sistema Nacional NFS-e (${endpoint}) após todas as tentativas: ${describeCause(cause)}`,
      externalMessage:
        'Não foi possível comunicar com o órgão fiscal no momento. Tente novamente em instantes.',
      context,
    });
  }
}

function describeCause(cause: unknown): string {
  if (!(cause instanceof Error)) return safeStringify(cause);

  const record = cause as unknown as Record<string, unknown>;
  const parts = [cause.message];

  const status = record.statusCode;
  if (typeof status === 'number' || typeof status === 'string') {
    parts.push(`statusCode=${status}`);
  }
  const body = record.body;
  if (typeof body === 'string' && body.trim()) {
    parts.push(`body=${body.replace(/\s+/g, ' ').slice(0, 600)}`);
  }

  return parts.join(' | ');
}

function safeStringify(value: unknown): string {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}
