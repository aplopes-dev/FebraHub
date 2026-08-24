import { FiscalApiError } from "@/lib/api/fiscal-client";
import { ProvisionDataError } from "../types/certificate";

export type TranslatedCertificateError = {
  message: string;
  /** Presente quando o erro tem uma ação de navegação (FR-009, spec erp/010). */
  actionHref?: string;
  actionLabel?: string;
};

/**
 * Traduz erros da fiscal-api em mensagem de negócio, por família (FR-012), sem
 * expor stack trace nem código HTTP cru (FR-013).
 *
 * A fiscal-api já devolve mensagens de domínio (o `AppExceptionFilter` mapeia
 * por nome de erro); aqui damos um texto claro e acionável por família, usando
 * o status e palavras-chave da mensagem original como pistas.
 */
export function translateCertificateError(
  error: unknown,
): TranslatedCertificateError {
  // Erro de provisionamento (FR-007/008/009) — carrega link pra filial matriz
  // quando aplicável (checado antes de `Error` genérico, que ele estende).
  if (error instanceof ProvisionDataError) {
    return {
      message: error.message,
      actionHref: error.actionHref,
      actionLabel: error.actionLabel,
    };
  }

  if (error instanceof FiscalApiError) {
    const raw = error.message?.toLowerCase() ?? "";

    // CNPJ divergente — o erro mais provável na operação real.
    if (raw.includes("cnpj") && (raw.includes("diverg") || raw.includes("difere") || raw.includes("titular"))) {
      return { message: error.message };
    }

    if (error.status === 400) {
      return { message: "Selecione o arquivo do certificado e informe a senha." };
    }

    if (error.status === 413) {
      return { message: "Arquivo muito grande: envie um certificado de até 10 MB." };
    }

    if (error.status === 422) {
      // A API distingue os casos; se a mensagem for útil, repassamos.
      if (raw.includes("senha") || raw.includes("password")) {
        return {
          message:
            "Senha incorreta ou certificado inválido. Verifique a senha e tente novamente.",
        };
      }
      if (raw.includes("exp") || raw.includes("venc")) {
        return {
          message: "O certificado enviado está expirado. Envie um certificado válido.",
        };
      }
      if (raw.includes("extens") || raw.includes(".pfx") || raw.includes(".p12") || raw.includes("formato")) {
        return {
          message: "Arquivo inválido: envie um certificado no formato .pfx ou .p12.",
        };
      }
      return { message: error.message || "Não foi possível validar o certificado enviado." };
    }

    // Demais status: usa a mensagem de domínio da API se houver, sem o código.
    return {
      message: error.message || "Não foi possível concluir a operação. Tente novamente.",
    };
  }

  if (error instanceof Error && error.message) {
    return { message: error.message };
  }

  return { message: "Ocorreu um erro inesperado. Tente novamente." };
}
