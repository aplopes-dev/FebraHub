import type { RequestActor } from '../../../../../../shared/infra/tenancy/tenant-context';

/**
 * Nome do ator para denormalizar em linhas de histórico/timeline — o `name`
 * do Keycloak pode vir vazio (conta recém-criada, bypass de dev), então cai
 * para o e-mail e por fim um rótulo genérico.
 */
export function resolveActorName(actor: RequestActor): string {
  return actor.name?.trim() || actor.email || 'Usuário';
}
