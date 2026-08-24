import type { FiscalApiCustomer } from '../../domain/providers/fiscal-api-client.interface';

/**
 * Pedido de emissão de NFS-e montado pela tela (spec erp/018). O erp-api resolve
 * o Grupo de ISSQN (códigos/alíquota/exigibilidade) e monta o `IssueNfseRequest`
 * — a fiscal-api recebe pronto.
 */
export type IssueNfseInput = {
  organizationId: string;
  // ⚠️ SEM `companyId` do cliente: o erp-api resolve o Emitente pelo CNPJ da
  // própria organização (isolamento de tenant — spec erp/018 CRITICAL fix).
  /** Grupo de ISSQN escolhido — traz código municipal, cTribNac, alíquota, exigibilidade. */
  issqnGroupId: string;
  /** Referência da operação do ERP (a tela gera por tentativa; base da idempotência). */
  externalReference: string;
  customer: FiscalApiCustomer;
  serviceDescription: string;
  totalValue: number;
  issWithheld: boolean;
};
