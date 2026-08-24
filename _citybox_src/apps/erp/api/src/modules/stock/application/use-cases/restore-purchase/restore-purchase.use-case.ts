import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { Purchase } from '../../../domain/entities/purchase.entity';
import { PurchaseNotFoundError } from '../../../domain/errors/purchase-not-found.error';
import { PurchaseRepository } from '../../../domain/repositories/purchase.repository.interface';
import type { RestorePurchaseDto } from '../../dtos/purchase.dto';

/**
 * Restaura compra soft-deleted (volta à aba Ativas).
 *
 * Idempotente se já estiver ativa. Não cria nem estorna movimento de estoque.
 */
@Injectable()
export class RestorePurchaseUseCase implements IUseCase<
  RestorePurchaseDto,
  Purchase
> {
  constructor(private readonly purchaseRepository: PurchaseRepository) {}

  async execute(input: RestorePurchaseDto): Promise<Purchase> {
    const detail = await this.purchaseRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!detail) throw new PurchaseNotFoundError(input.id);

    const { purchase } = detail;
    if (!purchase.deletedAt) return purchase;

    const restored = purchase.restore();
    await this.purchaseRepository.clearDeletedAt(
      input.organizationId,
      input.id,
      restored.updatedAt,
    );
    return restored;
  }
}
