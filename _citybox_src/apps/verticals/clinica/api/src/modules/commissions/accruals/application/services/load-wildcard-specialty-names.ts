import type { CommissionRule } from '../../../rules/domain/entities/commission-rule.entity';
import type { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';

/**
 * Carrega nomes das especialidades referenciadas por regras com plano wildcard
 * (`planId` null + `specialtyId` set) para match por nome entre planos.
 */
export async function loadWildcardSpecialtyNamesById(
  prisma: PrismaService,
  storeId: string,
  rules: readonly CommissionRule[],
): Promise<Map<string, string>> {
  const ids = [
    ...new Set(
      rules
        .filter((rule) => !rule.planId && rule.specialtyId)
        .map((rule) => rule.specialtyId as string),
    ),
  ];
  if (ids.length === 0) return new Map();

  const rows = await prisma.clinicPlanSpecialty.findMany({
    where: { storeId, id: { in: ids } },
    select: { id: true, name: true },
  });

  return new Map(rows.map((row) => [row.id, row.name]));
}
