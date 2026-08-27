import { ApiError } from "./client";
import { FiscalApiError } from "./fiscal-client";

/**
 * Códigos de erro que **não** são de negócio — nunca acionáveis pelo usuário,
 * então nunca mostrados crus. `ValidatorDomainError` é o caso que motivou
 * esta função (BUG-05, 2026-08-13): o toast mostrava literalmente
 * `"legalName: Invalid input: expected string, received undefined; ..."`
 * — um dump de validação interna, não uma mensagem que o lojista pode agir.
 */
const NON_BUSINESS_ERROR_CODES = new Set(["ValidatorDomainError"]);

const DEFAULT_FALLBACK = "Não foi possível salvar. Tente novamente.";

/**
 * spec erp/023, N5: um 401/403 sem `code` reconhecível vem direto do guard do
 * NestJS (`{"message":"Forbidden resource"}`), sem passar pelo
 * `AppExceptionFilter` — não é erro de domínio traduzido, é o texto cru do
 * framework. Achado no re-teste: o diálogo de nova série mostrava
 * literalmente "Forbidden".
 */
const PERMISSION_DENIED_MESSAGE =
  "Seu usuário não tem permissão para realizar esta ação.";

/**
 * Mensagem segura para exibir ao usuário a partir de um erro de API.
 *
 * Mostra `error.message` só quando ele é de negócio (o backend já traduz pra
 * texto acionável) — para `ValidatorDomainError`, qualquer 5xx, ou erro sem
 * `code` reconhecível, cai numa mensagem genérica em vez de expor detalhe
 * interno de implementação.
 */
export function businessErrorMessage(
  error: unknown,
  fallback: string = DEFAULT_FALLBACK,
): string {
  if (error instanceof FiscalApiError || error instanceof ApiError) {
    if (error.status >= 500) return fallback;
    if (error.code && NON_BUSINESS_ERROR_CODES.has(error.code)) return fallback;
    // Sem `code`: não passou pelo `AppExceptionFilter`, então `message` não é
    // texto traduzido — é o corpo padrão do NestJS. Um 403/401 com `code`
    // continua caindo no branch de baixo (erro de domínio real, ex.: um
    // `*ForbiddenError` já traduzido para português pela API).
    if ((error.status === 401 || error.status === 403) && !error.code) {
      return PERMISSION_DENIED_MESSAGE;
    }
    if (error.message) return error.message;
    return fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
