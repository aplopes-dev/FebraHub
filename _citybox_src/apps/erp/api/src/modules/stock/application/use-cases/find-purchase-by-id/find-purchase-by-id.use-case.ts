import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PurchaseNotFoundError } from '../../../domain/errors/purchase-not-found.error';
import { PurchaseRepository } from '../../../domain/repositories/purchase.repository.interface';
import type {
  FindPurchaseByIdDto,
  FindPurchaseByIdResult,
} from '../../dtos/purchase.dto';

@Injectable()
export class FindPurchaseByIdUseCase implements IUseCase<
  FindPurchaseByIdDto,
  FindPurchaseByIdResult
> {
  constructor(private readonly purchaseRepository: PurchaseRepository) {}

  async execute(input: FindPurchaseByIdDto): Promise<FindPurchaseByIdResult> {
    const detail = await this.purchaseRepository.findById(
      input.organizationId,
      input.id,
    );
    // Devolve mesmo excluída: a aba "Excluídas" da listagem leva até ela.
    if (!detail) throw new PurchaseNotFoundError(input.id);

    return detail;
  }
}
