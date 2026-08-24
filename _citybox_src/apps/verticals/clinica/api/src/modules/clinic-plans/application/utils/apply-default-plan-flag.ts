import type { ClinicPlanRepository } from '../../domain/repositories/clinic-plan.repository.interface';
import { ClinicPlanNotFoundError } from '../../domain/errors/clinic-plan.errors';

export async function applyDefaultPlanFlag(
  repository: ClinicPlanRepository,
  storeId: string,
  targetPlanId: string,
  context: string,
): Promise<void> {
  const target = await repository.findById(storeId, targetPlanId);
  if (!target) {
    throw new ClinicPlanNotFoundError(context, targetPlanId);
  }

  await repository.clearDefaultForStore(storeId, targetPlanId);
  target.markAsDefault();
  await repository.save(target);
}
