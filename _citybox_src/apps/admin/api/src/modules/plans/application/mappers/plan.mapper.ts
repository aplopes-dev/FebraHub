import type { CreatePlanDto, UpdatePlanDto } from '../dtos/plan.dto';
import type { PlanProps } from '../../domain/entities/plan.entity';

export function normalizePlanCode(code: string): string {
  return code.trim().toLowerCase();
}

export function mapCreateDtoToPlanProps(dto: CreatePlanDto): PlanProps {
  return {
    code: normalizePlanCode(dto.code),
    name: dto.name.trim(),
    description: dto.description.trim(),
    prices: (dto.prices ?? []).map((p) => ({
      stripePriceId: p.stripePriceId ?? null,
      cycle: p.cycle,
      priceCents: p.priceCents,
    })),
    vertical: dto.vertical.trim(),
    tier: dto.tier.trim(),
    // maxStores é mantido em sincronia com maxNegocios só para compatibilidade da coluna
    // legada até a migration de contract (research.md #5) — não faz parte do contrato HTTP.
    maxStores: dto.maxNegocios,
    maxNegocios: dto.maxNegocios,
    maxUsers: dto.maxUsers,
    maxProducts: dto.maxProducts ?? null,
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function mapUpdateDtoToPlanProps(
  dto: UpdatePlanDto,
): Pick<
  PlanProps,
  | 'name'
  | 'description'
  | 'prices'
  | 'vertical'
  | 'tier'
  | 'maxStores'
  | 'maxNegocios'
  | 'maxUsers'
  | 'maxProducts'
  | 'status'
> {
  return {
    name: dto.name.trim(),
    description: dto.description.trim(),
    prices: (dto.prices ?? []).map((p) => ({
      stripePriceId: p.stripePriceId ?? null,
      cycle: p.cycle,
      priceCents: p.priceCents,
    })),
    vertical: dto.vertical.trim(),
    tier: dto.tier.trim(),
    maxStores: dto.maxNegocios,
    maxNegocios: dto.maxNegocios,
    maxUsers: dto.maxUsers,
    maxProducts: dto.maxProducts ?? null,
    status: dto.status,
  };
}
