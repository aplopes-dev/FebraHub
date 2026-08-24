import type { Supplier } from '../../../../domain/entities/supplier.entity';
import type { ListSuppliersResult } from '../../../../application/dtos/supplier.dto';

/**
 * `foundationDate` sai como `yyyy-mm-dd`: a coluna é `@db.Date`, sem hora nem
 * fuso — devolver um ISO completo faria o front recuar um dia a oeste de
 * Greenwich.
 */
function toIsoDate(date: Date | null): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}

export class SupplierPresenter {
  static toHttp(supplier: Supplier) {
    return {
      id: supplier.id,
      personType: supplier.personType,
      name: supplier.name,
      legalName: supplier.legalName,
      document: supplier.document,
      stateRegistration: supplier.stateRegistration,
      stateExempt: supplier.stateExempt,
      municipalRegistration: supplier.municipalRegistration,
      sufamaRegistration: supplier.sufamaRegistration,
      foundationDate: toIsoDate(supplier.foundationDate),
      note: supplier.note,
      branchIds: supplier.branchIds,
      contact: supplier.contact,
      address: supplier.address,
      deletedAt: supplier.deletedAt?.toISOString() ?? null,
      createdAt: supplier.createdAt.toISOString(),
      updatedAt: supplier.updatedAt.toISOString(),
    };
  }

  static toHttpSingle(supplier: Supplier) {
    return { data: this.toHttp(supplier) };
  }

  static toHttpList(result: ListSuppliersResult) {
    return {
      data: result.items.map((supplier) => this.toHttp(supplier)),
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
