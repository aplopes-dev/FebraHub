import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PurchaseNotFoundError } from '../../../domain/errors/purchase-not-found.error';
import { PurchaseRepository } from '../../../domain/repositories/purchase.repository.interface';
import type { DeletePurchaseDto } from '../../dtos/purchase.dto';

/**
 * Exclui a compra (soft-delete).
 *
 * Sem estornar o movimento de entrada já gerado — a compra é documento
 * fiscal; desfazer o efeito no estoque é ajuste manual à parte (regra F7 §4).
 * Restauração via `RestorePurchaseUseCase` só limpa `deletedAt`.
 */
@Injectable()
export class DeletePurchaseUseCase implements IUseCase<
  DeletePurchaseDto,
  void
> {
  constructor(private readonly purchaseRepository: PurchaseRepository) {}

  async execute(input: DeletePurchaseDto): Promise<void> {
    const detail = await this.purchaseRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!detail || detail.purchase.deletedAt) {
      throw new PurchaseNotFoundError(input.id);
    }

    await this.purchaseRepository.softDelete(
      input.organizationId,
      input.id,
      new Date(),
    );
  }
}
