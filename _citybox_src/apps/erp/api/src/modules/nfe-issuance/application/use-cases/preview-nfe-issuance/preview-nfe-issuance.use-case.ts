import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { NfeIssuanceRepository } from '../../../domain/repositories/nfe-issuance.repository.interface';
import { ResolveSaleOrderItemsService } from '../../services/resolve-sale-order-items';
import type { NfePreview } from '../../dtos/issue-nfe.dto';

export type PreviewNfeIssuanceInput = {
  organizationId: string;
  saleOrderId: string;
  destinationUf?: string | null;
};

/**
 * Prévia da emissão (spec erp/026, FR-005) — resolve os mesmos itens que a
 * emissão real resolveria, **sem** chamar a fiscal-api nem persistir nada.
 * A tela usa isso pra mostrar os avisos de fallback por item/tributo ANTES
 * do lojista confirmar — a emissão em si nunca é bloqueada por ter avisos
 * (decisão do clarify), mas o aviso precisa aparecer antes, não depois.
 */
@Injectable()
export class PreviewNfeIssuanceUseCase implements IUseCase<
  PreviewNfeIssuanceInput,
  NfePreview
> {
  constructor(
    private readonly repository: NfeIssuanceRepository,
    private readonly resolveSaleOrderItems: ResolveSaleOrderItemsService,
  ) {}

  async execute(input: PreviewNfeIssuanceInput): Promise<NfePreview> {
    const existing = await this.repository.findBySaleOrderId(
      input.organizationId,
      input.saleOrderId,
    );

    const { previewItems, warnings } = await this.resolveSaleOrderItems.execute(
      input.organizationId,
      input.saleOrderId,
      input.destinationUf,
    );

    return {
      saleOrderId: input.saleOrderId,
      items: previewItems,
      warnings,
      canIssue: !existing,
    };
  }
}
