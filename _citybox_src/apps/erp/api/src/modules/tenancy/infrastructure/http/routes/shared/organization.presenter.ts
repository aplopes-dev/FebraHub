import type { Organization } from '../../../../domain/entities/organization.entity';
import type { OrganizationSummary } from '../../../../domain/repositories/organization.repository.interface';

export class OrganizationPresenter {
  static toHttp(organization: Organization) {
    return {
      id: organization.id,
      personType: organization.personType,
      document: organization.document,
      legalName: organization.legalName,
      tradeName: organization.tradeName,
      displayName: organization.displayName,
      email: organization.email,
      phone: organization.phone,
      responsible: {
        name: organization.responsibleName,
        document: organization.responsibleDocument,
        email: organization.responsibleEmail,
        phone: organization.responsiblePhone,
      },
      status: organization.status,
      // Loja da plataforma vinculada — necessária para provisionar o Emitente
      // fiscal (services/fiscal-api). `null` quando a organização ainda não foi
      // provisionada por evento da plataforma (a tela Fiscal trata esse caso).
      platformStoreId: organization.platformStoreId,
      createdAt: organization.createdAt.toISOString(),
      updatedAt: organization.updatedAt.toISOString(),
    };
  }

  static toHttpSingle(organization: Organization) {
    return { data: this.toHttp(organization) };
  }

  /** Seletor de empresa: o papel do usuário importa mais que o cadastro completo. */
  static toHttpList(items: OrganizationSummary[]) {
    return {
      data: items.map(({ organization, role, branchCount }) => ({
        id: organization.id,
        document: organization.document,
        legalName: organization.legalName,
        tradeName: organization.tradeName,
        displayName: organization.displayName,
        status: organization.status,
        role,
        branchCount,
      })),
    };
  }
}
