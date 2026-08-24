import { InfrastructureError } from '../../../core/errors/infrastructure.error';

/// Mapeia para 503 via AppExceptionFilter (nome contém "Unavailable") — falha
/// de comunicação (rede, timeout, TLS) com um webservice SOAP da SEFAZ, após
/// esgotar as tentativas de retry. Distinto de uma rejeição de negócio
/// (cStat de erro em uma resposta bem-formada), que nunca lança esta classe.
/// `node-soap` rejeita com um objeto (não `Error`) carregando `body`/`response`
/// quando o servidor devolve HTTP de erro. `String(objeto)` produzia
/// "[object Object]", escondendo justamente a resposta do órgão fiscal — que é
/// a única informação útil para diagnosticar a falha.
function describeCause(cause: unknown): string {
  if (cause instanceof Error) {
    // O `node-soap` monta a mensagem concatenando um objeto, então `.message`
    // vem literalmente "[object Object]" quando o servidor devolve HTTP de
    // erro. A resposta real fica em propriedades anexadas ao próprio Error
    // (`body`, `response`) — sem elas não há como diagnosticar nada.
    const extras = describeAttachedProperties(cause);
    if (extras) return `${cause.message} | ${extras}`;
    return cause.message;
  }
  if (typeof cause === 'string') return cause;
  if (cause && typeof cause === 'object') {
    const record = cause as Record<string, unknown>;
    const parts: string[] = [];
    for (const key of ['message', 'code', 'statusCode', 'body', 'response']) {
      const value = record[key];
      if (value === undefined || value === null) continue;
      const text = typeof value === 'string' ? value : safeStringify(value);
      if (text) parts.push(`${key}=${text.slice(0, 500)}`);
    }
    if (parts.length > 0) return parts.join(' | ');
    return safeStringify(cause).slice(0, 500);
  }
  return String(cause);
}

/// Extrai as propriedades que o `node-soap` anexa ao Error com a resposta HTTP
/// bruta do servidor. `statusCode` e um trecho do corpo bastam para distinguir
/// certificado recusado, endpoint errado e indisponibilidade real.
function describeAttachedProperties(error: Error): string {
  const record = error as unknown as Record<string, unknown>;
  const parts: string[] = [];

  const status = record.statusCode ?? readNested(record.response, 'statusCode');
  if (typeof status === 'number' || typeof status === 'string') {
    parts.push(`statusCode=${status}`);
  }

  const body = record.body ?? readNested(record.response, 'body');
  if (typeof body === 'string' && body.trim()) {
    parts.push(`body=${body.replace(/\s+/g, ' ').slice(0, 600)}`);
  } else if (body && typeof body === 'object') {
    parts.push(`body=${safeStringify(body).slice(0, 600)}`);
  }

  return parts.join(' | ');
}

function readNested(container: unknown, key: string): unknown {
  if (!container || typeof container !== 'object') return undefined;
  return (container as Record<string, unknown>)[key];
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value) ?? '';
  } catch {
    return '';
  }
}

export class SefazUnavailableError extends InfrastructureError {
  constructor(context: string, operation: string, cause: unknown) {
    const causeMessage = describeCause(cause);
    super({
      internalMessage: `Falha de comunicação com a SEFAZ (operação "${operation}") após todas as tentativas: ${causeMessage}`,
      externalMessage:
        'Não foi possível comunicar com o órgão fiscal no momento. Tente novamente em instantes.',
      context,
    });
  }
}
