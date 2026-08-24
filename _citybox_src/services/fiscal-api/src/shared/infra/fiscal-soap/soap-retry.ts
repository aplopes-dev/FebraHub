export type RetryOptions = {
  /// Número de tentativas ADICIONAIS após a primeira (padrão 2 → até 3
  /// tentativas no total).
  maxRetries?: number;
  baseDelayMs?: number;
  isRetryable?: (error: unknown) => boolean;
  /// Injetável em teste para não esperar o backoff real.
  sleep?: (ms: number) => Promise<void>;
};

const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_BASE_DELAY_MS = 500;

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/// Retry genérico com backoff exponencial (500ms, 1s, 2s, ...) — usado pelo
/// cliente SOAP da SEFAZ para tolerar falhas transitórias de rede sem
/// reenviar automaticamente em caso de erro de negócio (`isRetryable` decide;
/// o cliente SOAP só marca como retryable falhas de comunicação, nunca uma
/// resposta SOAP bem-formada com rejeição).
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  const baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const isRetryable = options.isRetryable ?? (() => true);
  const sleep = options.sleep ?? defaultSleep;

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries || !isRetryable(error)) {
        throw error;
      }
      await sleep(baseDelayMs * 2 ** attempt);
    }
  }
  // Inalcançável (o loop sempre retorna ou lança), mas satisfaz o compilador.
  throw lastError;
}
