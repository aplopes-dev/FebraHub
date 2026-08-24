import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { Stock } from '../../../domain/entities/stock.entity';
import { StockRepository } from '../../../domain/repositories/stock.repository.interface';
import { StockNotFoundError } from '../../../domain/errors/stock-not-found.error';
import type { FindStockByIdDto } from '../../dtos/stock.dto';

@Injectable()
export class FindStockByIdUseCase implements IUseCase<FindStockByIdDto, Stock> {
  constructor(private readonly stockRepository: StockRepository) {}

  async execute(input: FindStockByIdDto): Promise<Stock> {
    const stock = await this.stockRepository.findById(
      input.organizationId,
      input.id,
    );
    // Estoque de outra organização e estoque inexistente devolvem o mesmo
    // 404 — a diferença revelaria que o id existe em outro tenant.
    if (!stock) throw new StockNotFoundError(input.id);

    return stock;
  }
}
