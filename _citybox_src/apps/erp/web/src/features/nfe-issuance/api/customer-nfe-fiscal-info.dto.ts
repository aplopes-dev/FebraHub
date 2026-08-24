import type { IssueNfeCustomerAddressPayload } from "./nfe-issuance.dto";

/**
 * Dados fiscais do tomador, resolvedor próprio da NF-e (spec erp/028) — a
 * NF-e exige endereço no grupo `dest` (`enderDest`), a NFS-e não. Reusar o
 * `CustomerFiscalInfo` de `nfse-issuance` (que carrega só documentType/
 * document/name/email, sem endereço) foi a causa-raiz da rejeição `719`
 * ("NF-e sem a identificação do destinatario"): a tela de NF-e reusou o
 * resolvedor pensado para a NFS-e sem notar que os contratos fiscais dos
 * dois documentos divergem. Ver `/speckit-clarify` da spec 028 — decisão
 * explícita por um resolvedor separado em vez de estender o tipo
 * compartilhado.
 */
export type CustomerNfeFiscalInfo = {
  documentType: "CPF" | "CNPJ";
  document: string;
  name: string;
  email: string | null;
  /**
   * `null` = sem endereço utilizável — cliente sem endereço cadastrado, ou
   * com cidade fora da tabela IBGE estática (`@/lib/ibge-lookup`). A tela
   * bloqueia a emissão nesse caso (FR-002) em vez de deixar a SEFAZ recusar
   * de novo.
   */
  address: IssueNfeCustomerAddressPayload | null;
};
