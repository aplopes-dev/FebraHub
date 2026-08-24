import { BadRequestException, Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { toIsoDateOnly } from '../../../../financial/entries/application/utils/financial-entry.utils';
import { DashboardSalesGoalRepository } from '../../../domain/repositories/dashboard-sales-goal.repository.interface';

export type UpsertDashboardSalesGoalDto = {
  storeId: string;
  goalCents: number;
  /** Optional clock for tests; defaults to now. */
  now?: Date;
};

export type UpsertDashboardSalesGoalResult = {
  goalCents: number;
  startDate: string;
};

/**
 * Cria ou substitui a meta ativa da loja. Substituir reinicia o acúmulo:
 * a nova meta passa a contar vendas a partir do dia civil da criação.
 */
@Injectable()
export class UpsertDashboardSalesGoalUseCase
  implements
    IUseCase<UpsertDashboardSalesGoalDto, UpsertDashboardSalesGoalResult>
{
  constructor(
    private readonly salesGoalRepository: DashboardSalesGoalRepository,
  ) {}

  async execute(
    dto: UpsertDashboardSalesGoalDto,
  ): Promise<UpsertDashboardSalesGoalResult> {
    if (!Number.isInteger(dto.goalCents) || dto.goalCents <= 0) {
      throw new BadRequestException('goalCents deve ser um inteiro positivo');
    }

    const startDate = toIsoDateOnly(dto.now ?? new Date());
    const saved = await this.salesGoalRepository.create({
      storeId: dto.storeId,
      goalCents: dto.goalCents,
      startDate,
    });

    return {
      goalCents: saved.goalCents,
      startDate: saved.startDate,
    };
  }
}
