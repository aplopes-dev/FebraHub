// Opções de domínio da tela de informações adicionais (spec erp/017).

export const FISCAL_DOCUMENT_TYPES = ["NFE", "NFCE", "NFSE"] as const;
export type FiscalDocumentType = (typeof FISCAL_DOCUMENT_TYPES)[number];

export const ADDITIONAL_INFO_TARGETS = ["INF_CPL", "INF_AD_FISCO"] as const;
export type AdditionalInfoTarget = (typeof ADDITIONAL_INFO_TARGETS)[number];

export const DOCUMENT_TYPE_LABEL: Record<FiscalDocumentType, string> = {
  NFE: "NF-e",
  NFCE: "NFC-e",
  NFSE: "NFS-e",
};

export const TARGET_LABEL: Record<AdditionalInfoTarget, string> = {
  INF_CPL: "Contribuinte (dados adicionais)",
  INF_AD_FISCO: "Fisco (informações ao fisco)",
};

export function isFiscalDocumentType(value: string): value is FiscalDocumentType {
  return (FISCAL_DOCUMENT_TYPES as readonly string[]).includes(value);
}

/**
 * A NFS-e nacional não tem campo de informação ao fisco (o `DPS_v1.01.xsd` não
 * possui `infAdFisco` — plan D10): para NFS-e só o destino do contribuinte
 * existe. A UI desabilita a opção com o motivo, e a API recusa por garantia.
 */
export function isTargetAvailable(
  documentType: FiscalDocumentType,
  target: AdditionalInfoTarget,
): boolean {
  if (documentType === "NFSE" && target === "INF_AD_FISCO") return false;
  return true;
}

// Tetos do XSD por (documento, destino) — plan D8/D10. Espelham a entidade da
// erp-api; a UI usa para o `maxLength` do campo e o aviso de excesso.
const INF_CPL_MAX_NFE = 5000;
const INF_AD_FISCO_MAX_NFE = 2000;
const X_INF_COMP_MAX_NFSE = 2000;

export function maxLengthFor(
  documentType: FiscalDocumentType,
  target: AdditionalInfoTarget,
): number {
  if (documentType === "NFSE") return X_INF_COMP_MAX_NFSE;
  return target === "INF_AD_FISCO" ? INF_AD_FISCO_MAX_NFE : INF_CPL_MAX_NFE;
}
