import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import type { CostCenter } from '../../../domain/entities/cost-center.entity';
import { CostCenterRepository } from '../../../domain/repositories/cost-center.repository.interface';
import { CostCenterNotFoundError } from '../../../domain/errors/cost-center-not-found.error';
import type { RestoreCostCenterDto } from '../../dtos/cost-center.dto';

@Injectable()
export class RestoreCostCenterUseCase implements IUseCase<
  RestoreCostCenterDto,
  CostCenter
> {
  constructor(private readonly costCenterRepository: CostCenterRepository) {}

  async execute(input: RestoreCostCenterDto): Promise<CostCenter> {
    const costCenter = await this.costCenterRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!costCenter) throw new CostCenterNotFoundError(input.id);

    // Restaurar quem já está ativo não é erro: o botão pode ter sido clicado
    // duas vezes, e o resultado desejado — centro de custo ativo — é o mesmo.
    if (!costCenter.deletedAt) return costCenter;

    const restored = costCenter.restore();
    await this.costCenterRepository.clearDeletedAt(
      input.organizationId,
      input.id,
      restored.updatedAt,
    );
    return restored;
  }
}
