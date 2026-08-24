import type { Customer } from '../../../../domain/entities/customer.entity';
import type { ListCustomersResult } from '../../../../application/dtos/customer.dto';

function toIsoDate(date: Date | null): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}

export class CustomerPresenter {
  static toHttpDetail(customer: Customer) {
    return {
      id: customer.id,
      personType: customer.personType,
      name: customer.name,
      document: customer.document,
      rg: customer.rg,
      birthDate: toIsoDate(customer.birthDate),
      email: customer.email,
      mobilePhone: customer.mobilePhone,
      phone: customer.phone,
      additionalPhones: customer.additionalPhones,
      stage: customer.stage,
      categoryId: customer.categoryId,
      notes: customer.notes,
      addresses: customer.addresses,
      branchIds: customer.branchIds,
      deletedAt: customer.deletedAt?.toISOString() ?? null,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
    };
  }

  /** Envelope da listagem — alinhado ao mock do web. */
  static toHttpListItem(customer: Customer) {
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email ?? '',
      phone: customer.primaryPhone,
      salesTotal: 0,
      createdAt: customer.createdAt.toISOString(),
      stage: customer.stage,
      categoryId: customer.categoryId,
    };
  }

  static toHttpSingle(customer: Customer) {
    return { data: this.toHttpDetail(customer) };
  }

  static toHttpList(result: ListCustomersResult) {
    return {
      data: result.items.map((customer) => this.toHttpListItem(customer)),
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
