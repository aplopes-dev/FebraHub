import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { CostCenterRepository } from '../../../domain/repositories/cost-center.repository.interface';
import { CostCenterNotFoundError } from '../../../domain/errors/cost-center-not-found.error';
import { CostCenterNotRemovableError } from '../../../domain/errors/cost-center-not-removable.error';
import type { DeleteCostCenterDto } from '../../dtos/cost-center.dto';

/**
 * Exclui o centro de custo (soft-delete).
 *
 * Nunca apaga: lançamentos financeiros já registrados apontam para ele, e os
 * relatórios por área precisam continuar resolvendo.
 */
@Injectable()
export class DeleteCostCenterUseCase implements IUseCase<
  DeleteCostCenterDto,
  void
> {
  constructor(private readonly costCenterRepository: CostCenterRepository) {}

  async execute(input: DeleteCostCenterDto): Promise<void> {
    const costCenter = await this.costCenterRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!costCenter || costCenter.deletedAt) {
      throw new CostCenterNotFoundError(input.id);
    }

    if (costCenter.isSystem) {
      throw new CostCenterNotRemovableError(input.id);
    }

    const deleted = costCenter.softDelete();
    await this.costCenterRepository.softDelete(
      input.organizationId,
      input.id,
      deleted.deletedAt ?? new Date(),
    );
  }
}
