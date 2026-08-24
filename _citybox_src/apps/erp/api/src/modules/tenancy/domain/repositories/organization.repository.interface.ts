import type { Organization } from '../entities/organization.entity';
import type { Membership } from '../entities/membership.entity';

export type OrganizationSummary = {
  organization: Organization;
  /** Papel do usuário consultado nesta organização. */
  role: Membership['role'];
  branchCount: number;
};

export abstract class OrganizationRepository {
  abstract findById(id: string): Promise<Organization | null>;
  abstract findByDocument(document: string): Promise<Organization | null>;

  /**
   * A organização espelhada de uma loja da plataforma.
   *
   * É o que torna o consumidor de `citybox.store.*` idempotente: um
   * `store.created` reentregue encontra a organização existente em vez de criar
   * uma segunda para o mesmo lojista.
   */
  abstract findByPlatformStoreId(
    platformStoreId: string,
  ): Promise<Organization | null>;

  /**
   * Cria a organização e o vínculo de responsável na mesma transação.
   *
   * Nascem juntos porque uma organização sem OWNER é inacessível: ninguém
   * poderia sequer listá-la para consertar.
   */
  abstract createWithOwner(
    organization: Organization,
    ownerUserId: string,
  ): Promise<{ organization: Organization; membership: Membership }>;

  abstract save(organization: Organization): Promise<Organization>;

  /** Organizações em que o usuário tem vínculo ativo — consulta cross-tenant. */
  abstract findAllByUser(userId: string): Promise<OrganizationSummary[]>;
}
