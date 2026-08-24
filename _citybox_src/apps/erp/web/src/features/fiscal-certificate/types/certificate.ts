/** Tipos de UI da feature de Certificado Digital A1. */

import type { FiscalTaxRegime } from "../lib/regime-map";

/**
 * Erro de negócio do provisionamento (FR-007/008/009) que opcionalmente carrega
 * uma ação de navegação — distinto de `FiscalApiError`/`Error` genérico pra
 * `translateCertificateError` saber quando renderizar o link (spec erp/010
 * Clarifications 2026-08-13: mensagem só em texto confundiu um usuário real).
 */
export class ProvisionDataError extends Error {
  constructor(
    message: string,
    public readonly actionHref?: string,
    public readonly actionLabel?: string,
  ) {
    super(message);
    this.name = "ProvisionDataError";
  }
}

/** Status possíveis de um certificado na fiscal-api. */
export type CertificateStatus =
  | "PENDING_VALIDATION"
  | "VALID"
  | "EXPIRED"
  | "INVALID"
  | "REVOKED";

/** Certificado como a tela o consome (nunca inclui senha nem chave de armazenamento). */
export type Certificate = {
  id: string;
  companyId: string;
  type: string;
  name: string | null;
  subjectCnpj: string;
  validFrom: string;
  validUntil: string;
  status: CertificateStatus;
  createdAt: string;
  /** Dias até o vencimento (de `GET /certificates/{id}/status`); `null` se não carregado. */
  daysUntilExpiration: number | null;
};

/** Certificado enriquecido com derivações de UI. */
export type CertificateView = Certificate & {
  isCurrent: boolean;
  expiresSoon: boolean;
  isExpired: boolean;
};

/** Entrada do formulário de upload. A senha vive só aqui e é descartada após o envio. */
export type CertificateUploadInput = {
  file: File;
  password: string;
  name?: string;
};

/** Payload de provisionamento do Emitente (POST /v1/companies). */
export type ProvisionCompanyPayload = {
  storeId: string;
  cnpj: string;
  legalName: string;
  tradeName: string | null;
  stateRegistration: string | null;
  municipalRegistration: string | null;
  taxRegime: FiscalTaxRegime;
  cityCodeIbge: string;
  uf: string;
  address: {
    street: string;
    number: string;
    complement: string | null;
    district: string;
    city: string;
    zipCode: string;
  };
  defaultEnvironment: "HOMOLOGATION";
};

/**
 * Resultado de montar o payload a partir da filial matriz: ou o payload pronto,
 * ou um erro de negócio explicando o que falta/incompatibilidade (FR-007/008/009).
 * `actionHref`/`actionLabel` (FR-009, spec erp/010 Clarifications 2026-08-13):
 * quando o problema mora no cadastro da filial matriz, o erro carrega um link
 * direto pra lá — texto sozinho já confundiu um usuário real.
 */
export type ProvisionBuildResult =
  | { ok: true; payload: ProvisionCompanyPayload }
  | { ok: false; message: string; actionHref?: string; actionLabel?: string };
