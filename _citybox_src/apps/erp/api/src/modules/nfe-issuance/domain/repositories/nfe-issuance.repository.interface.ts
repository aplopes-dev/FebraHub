import type { NfeIssuance } from '../entities/nfe-issuance.entity';

export abstract class NfeIssuanceRepository {
  /**
   * Base real de FR-006/SC-004: um pedido de venda só pode gerar uma NF-e.
   * Chamado ANTES de resolver/emitir — encontrar um vínculo existente devolve
   * ele em vez de reemitir.
   */
  abstract findBySaleOrderId(
    organizationId: string,
    saleOrderId: string,
  ): Promise<NfeIssuance | null>;

  /** Lote por `saleOrderId` (spec erp/029) — usado pela listagem de Vendas/
   * Pedidos de venda para expor o vínculo NF-e sem N+1 (uma consulta por
   * página, não uma por linha). */
  abstract findBySaleOrderIds(
    organizationId: string,
    saleOrderIds: string[],
  ): Promise<NfeIssuance[]>;

  abstract findById(
    organizationId: string,
    id: string,
  ): Promise<NfeIssuance | null>;

  abstract listByOrganization(organizationId: string): Promise<NfeIssuance[]>;

  abstract save(issuance: NfeIssuance): Promise<NfeIssuance>;
}
