import type { PaymentMethod } from '../../../../domain/entities/payment-method.entity';
import type { ListPaymentMethodsResult } from '../../../../application/dtos/payment-method.dto';

export class PaymentMethodPresenter {
  static toHttp(paymentMethod: PaymentMethod) {
    return {
      id: paymentMethod.id,
      name: paymentMethod.name,
      fiscalCode: paymentMethod.fiscalCode,
      installmentPermission: paymentMethod.installmentPermission,
      isSystem: paymentMethod.isSystem,
      // spec erp/030 — exposto pra o frontend derivar `cardPaymentType`
      // (motor de recebíveis de `sales-orders`) do id real, em vez de um
      // catálogo mock local com ids inventados (`pm-cartao-credito` etc.).
      systemKey: paymentMethod.systemKey,
      deletedAt: paymentMethod.deletedAt?.toISOString() ?? null,
      createdAt: paymentMethod.createdAt.toISOString(),
      updatedAt: paymentMethod.updatedAt.toISOString(),
    };
  }

  static toHttpSingle(paymentMethod: PaymentMethod) {
    return { data: this.toHttp(paymentMethod) };
  }

  static toHttpList(result: ListPaymentMethodsResult) {
    return {
      data: result.items.map((paymentMethod) => this.toHttp(paymentMethod)),
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
