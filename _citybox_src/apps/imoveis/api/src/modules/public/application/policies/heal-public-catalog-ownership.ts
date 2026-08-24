import type { TeamMemberEntity } from '../../../settings/domain/entities/team-member.entity';
import type { PropertyRepository } from '../../../properties/domain/repositories/property.repository.interface';
import {
  resolveCatalogOrphanAssignAgentIds,
  resolveCatalogValidAgentIds,
} from './resolve-catalog-orphan-owners';

/**
 * Corrige **apenas** imóveis órfãos do catálogo:
 * - `agentId` null, ou
 * - `agentId` fora da equipe ativa da loja
 *
 * Destino: admin(s) ativos (sem round-robin entre corretores).
 *
 * Não move imóveis já vinculados a corretores da equipe — isso esvaziava
 * o catálogo do corretor e empilhava tudo no admin.
 */
export async function healPublicCatalogOwnership(
  properties: PropertyRepository,
  storeId: string,
  members: readonly TeamMemberEntity[],
): Promise<void> {
  const validAgentIds = resolveCatalogValidAgentIds(members);
  const assignToAgentIds = resolveCatalogOrphanAssignAgentIds(members);
  if (assignToAgentIds.length === 0) {
    return;
  }

  await properties.reassignOrphanAgentIds(storeId, {
    validAgentIds,
    assignToAgentIds,
  });
}
