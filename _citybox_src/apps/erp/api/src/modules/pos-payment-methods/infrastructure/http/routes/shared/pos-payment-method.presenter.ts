import type { PaymentMethod } from '../../../../../finance/payment-methods/domain/entities/payment-method.entity';

export class PosPaymentMethodPresenter {
  static toHttp(method: PaymentMethod) {
    return {
      id: method.id,
      name: method.name,
      fiscalCode: method.fiscalCode,
      systemKey: method.systemKey,
      installmentPermission: method.installmentPermission,
    };
  }

  static toHttpList(methods: PaymentMethod[]) {
    return { data: methods.map((method) => this.toHttp(method)) };
  }
}
