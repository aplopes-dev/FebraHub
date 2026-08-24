import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { BranchRepository } from '../../../../tenancy/domain/repositories/branch.repository.interface';
import { Stock } from '../../../domain/entities/stock.entity';
import { StockRepository } from '../../../domain/repositories/stock.repository.interface';
import type { CreateStockDto } from '../../dtos/stock.dto';
import { assertBranchesBelongToOrganization } from '../../../suppliers/application/use-cases/assert-branches-belong-to-organization';

/**
 * Cadastra um depósito da organização ativa.
 *
 * Invariante: unidades informadas precisam existir na organização.
 */
@Injectable()
export class CreateStockUseCase implements IUseCase<CreateStockDto, Stock> {
  constructor(
    private readonly stockRepository: StockRepository,
    private readonly branchRepository: BranchRepository,
  ) {}

  async execute(input: CreateStockDto): Promise<Stock> {
    const branchIds = await assertBranchesBelongToOrganization(
      this.branchRepository,
      input.organizationId,
      input.branchIds,
    );

    const stock = Stock.create({
      organizationId: input.organizationId,
      name: input.name,
      location: input.location,
      property: input.property,
      branchIds,
    });

    return this.stockRepository.save(stock);
  }
}
