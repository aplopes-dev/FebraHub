import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { StockMovementRepository } from '../../../domain/repositories/stock-movement.repository.interface';
import { StockMovementNotFoundError } from '../../../domain/errors/stock-movement-not-found.error';
import type {
  FindStockMovementByIdDto,
  StockMovementDetail,
} from '../../dtos/stock-movement.dto';

@Injectable()
export class FindStockMovementByIdUseCase implements IUseCase<
  FindStockMovementByIdDto,
  StockMovementDetail
> {
  constructor(
    private readonly stockMovementRepository: StockMovementRepository,
  ) {}

  async execute(input: FindStockMovementByIdDto): Promise<StockMovementDetail> {
    const detail = await this.stockMovementRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!detail) throw new StockMovementNotFoundError(input.id);
    return detail;
  }
}
