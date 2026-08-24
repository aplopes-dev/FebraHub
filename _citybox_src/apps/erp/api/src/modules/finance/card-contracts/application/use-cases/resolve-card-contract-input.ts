import type { UpdateCardContractInput } from '../../domain/entities/card-contract.entity';
import type { CardContractWritableDto } from '../dtos/card-contract.dto';

/**
 * Resolve o corpo do PUT em um conjunto completo de campos.
 *
 * Semântica de PUT: campo omitido volta ao default do contrato, não fica com o
 * valor anterior. Aplicar isso aqui, e não na entidade, deixa o `update` da
 * entidade explícito — ela recebe todos os campos e não adivinha nada.
 */
export function resolveCardContractUpdateInput(
  dto: CardContractWritableDto,
): UpdateCardContractInput {
  return {
    provider: dto.provider,
    bankAccountId: dto.bankAccountId ?? null,
    description: dto.description ?? '',
    grouping: dto.grouping ?? 'no_grouping',
    cutoffPeriod: dto.cutoffPeriod ?? 'daily',
    firstPaymentDayType: dto.firstPaymentDayType ?? 'business_days',
    installmentDayType: dto.installmentDayType ?? 'business_days',
    businessDaysOnly: dto.businessDaysOnly ?? true,
    depositFeeCents: dto.depositFeeCents ?? 0,
    anticipationPeriods: dto.anticipationPeriods ?? 0,
    anticipationRate: dto.anticipationRate ?? 0,
    allEntriesPaidInContract: dto.allEntriesPaidInContract ?? false,
    businessDaysDeposit: dto.businessDaysDeposit ?? true,
    active: dto.active ?? true,
  };
}
