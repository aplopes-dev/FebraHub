import type { Carrier } from '../../../../domain/entities/carrier.entity';
import type { ListCarriersResult } from '../../../../application/dtos/carrier.dto';

export class CarrierPresenter {
  static toHttp(carrier: Carrier) {
    return {
      id: carrier.id,
      personType: carrier.personType,
      deliveryType: carrier.deliveryType,
      name: carrier.name,
      legalName: carrier.legalName,
      document: carrier.document,
      icmsExempt: carrier.icmsExempt,
      registerInNfe: carrier.registerInNfe,
      stateRegistration: carrier.stateRegistration,
      stateExempt: carrier.stateExempt,
      municipalRegistration: carrier.municipalRegistration,
      branchIds: carrier.branchIds,
      contact: carrier.contact,
      address: carrier.address,
      deletedAt: carrier.deletedAt?.toISOString() ?? null,
      createdAt: carrier.createdAt.toISOString(),
      updatedAt: carrier.updatedAt.toISOString(),
    };
  }

  static toHttpSingle(carrier: Carrier) {
    return { data: this.toHttp(carrier) };
  }

  static toHttpList(result: ListCarriersResult) {
    return {
      data: result.items.map((carrier) => this.toHttp(carrier)),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
      tabCounts: result.tabCounts,
    };
  }
}
