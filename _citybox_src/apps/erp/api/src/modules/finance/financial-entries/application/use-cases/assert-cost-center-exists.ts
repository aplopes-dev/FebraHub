import { CostCenterRepository } from '../../../cost-centers/domain/repositories/cost-center.repository.interface';
import { CostCenterNotFoundError } from '../../../cost-centers/domain/errors/cost-center-not-found.error';

/**
 * Confere que o centro de custo informado numa linha de rateio existe, é da
 * organização ativa e não está excluído.
 */
export async function assertCostCenterExists(
  costCenterRepository: CostCenterRepository,
  organizationId: string,
  costCenterId: string,
): Promise<string> {
  const costCenter = await costCenterRepository.findById(
    organizationId,
    costCenterId,
  );
  if (!costCenter || costCenter.deletedAt) {
    throw new CostCenterNotFoundError(costCenterId);
  }

  return costCenterId;
}
