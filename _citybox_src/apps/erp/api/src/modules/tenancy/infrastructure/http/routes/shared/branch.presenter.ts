import type { Branch } from '../../../../domain/entities/branch.entity';
import type { ListBranchesResult } from '../../../../application/dtos/branch.dto';

export class BranchPresenter {
  static toHttp(branch: Branch) {
    return {
      id: branch.id,
      code: branch.code,
      personType: branch.personType,
      document: branch.document,
      legalName: branch.legalName,
      tradeName: branch.tradeName,
      displayName: branch.displayName,
      stateRegistration: branch.stateRegistration,
      municipalRegistration: branch.municipalRegistration,
      taxRegime: branch.taxRegime,
      isHeadquarters: branch.isHeadquarters,
      address: branch.address,
      phone: branch.phone,
      email: branch.email,
      timezone: branch.timezone,
      active: branch.active,
      createdAt: branch.createdAt.toISOString(),
      updatedAt: branch.updatedAt.toISOString(),
    };
  }

  static toHttpSingle(branch: Branch) {
    return { data: this.toHttp(branch) };
  }

  static toHttpList(result: ListBranchesResult) {
    return {
      data: result.items.map((branch) => this.toHttp(branch)),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }
}
