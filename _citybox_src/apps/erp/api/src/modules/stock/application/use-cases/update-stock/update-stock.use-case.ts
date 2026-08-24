import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { BranchRepository } from '../../../../tenancy/domain/repositories/branch.repository.interface';
import type { Stock } from '../../../domain/entities/stock.entity';
import { StockRepository } from '../../../domain/repositories/stock.repository.interface';
import { StockNotFoundError } from '../../../domain/errors/stock-not-found.error';
import type { UpdateStockDto } from '../../dtos/stock.dto';
import { assertBranchesBelongToOrganization } from '../../../suppliers/application/use-cases/assert-branches-belong-to-organization';

@Injectable()
export class UpdateStockUseCase implements IUseCase<UpdateStockDto, Stock> {
  constructor(
    private readonly stockRepository: StockRepository,
    private readonly branchRepository: BranchRepository,
  ) {}

  async execute(input: UpdateStockDto): Promise<Stock> {
    const stock = await this.stockRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!stock) throw new StockNotFoundError(input.id);

    const branchIds = await assertBranchesBelongToOrganization(
      this.branchRepository,
      input.organizationId,
      input.branchIds,
    );

    const updated = stock.update({
      name: input.name,
      location: input.location,
      property: input.property,
      branchIds,
    });

    return this.stockRepository.save(updated);
  }
}
