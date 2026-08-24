import type { FiscalApiCustomer } from '../../domain/providers/fiscal-api-client.interface';

/**
 * Pedido de emissão de NF-e a partir de um pedido de venda (spec erp/026). O
 * erp-api resolve ICMS/PIS-COFINS/IPI por linha (`ResolveItem*UseCase`,
 * já existentes) e monta o payload que a fiscal-api espera — a tela só
 * escolhe o pedido e confirma.
 */
export type IssueNfeInput = {
  organizationId: string;
  saleOrderId: string;
  /** Dados fiscais do tomador/destinatário — a tela já resolve isso hoje
   * (mesmo padrão de `nfse-issuance`, `getCustomerFiscalInfoApi`). */
  customer: FiscalApiCustomer;
};

/** Aviso de fallback por item/tributo (FR-005) — não bloqueia a emissão. */
export type FallbackWarning = {
  productId: string;
  productName: string;
  tributo: 'ICMS' | 'PIS_COFINS' | 'IPI';
};

export type PreviewedNfeItem = {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitValueCents: number;
  totalValueCents: number;
  hasFallbackIcms: boolean;
  hasFallbackPisCofins: boolean;
  hasFallbackIpi: boolean;
};

export type NfePreview = {
  saleOrderId: string;
  items: PreviewedNfeItem[];
  warnings: FallbackWarning[];
  /** `false` quando o pedido já tem NF-e emitida (FR-006) — a tela não deixa prosseguir. */
  canIssue: boolean;
};
