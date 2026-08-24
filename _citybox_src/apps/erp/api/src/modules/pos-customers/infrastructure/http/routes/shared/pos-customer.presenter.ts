import type { Customer } from '../../../../../customers/domain/entities/customer.entity';
import type { ListCustomersResult } from '../../../../../customers/application/dtos/customer.dto';
import { CustomerPresenter } from '../../../../../customers/infrastructure/http/routes/shared/customer.presenter';

/**
 * Envelope device do PDV — listagem traz documento/telefones para o seletor
 * (o presenter CRM de lista omite esses campos).
 */
export class PosCustomerPresenter {
  static toHttpListItem(customer: Customer) {
    return {
      id: customer.id,
      personType: customer.personType,
      name: customer.name,
      document: customer.document,
      email: customer.email ?? '',
      phone: customer.phone,
      mobilePhone: customer.mobilePhone,
      stage: customer.stage,
      categoryId: customer.categoryId,
      createdAt: customer.createdAt.toISOString(),
    };
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
    };
  }

  static toHttpSingle(customer: Customer) {
    return CustomerPresenter.toHttpSingle(customer);
  }
}
