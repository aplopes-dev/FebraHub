import type { CardPaymentMethod } from '../../../../domain/entities/card-payment-method.entity';

export class CardPaymentMethodPresenter {
  static toHttp(method: CardPaymentMethod) {
    return {
      id: method.id,
      type: method.type,
      brand: method.brand,
      rate: method.rate,
      feeCents: method.feeCents,
      settlementDays: method.settlementDays,
      minInstallments: method.minInstallments,
      maxInstallments: method.maxInstallments,
      firstPaymentDays: method.firstPaymentDays,
      daysBetweenInstallments: method.daysBetweenInstallments,
      progressiveEnabled: method.progressiveEnabled,
      progressiveTiers: method.rateTiers.map((tier) => ({
        id: tier.id,
        minInstallments: tier.minInstallments,
        maxInstallments: tier.maxInstallments,
        rate: tier.rate,
      })),
    };
  }

  static toHttpSingle(method: CardPaymentMethod) {
    return { data: this.toHttp(method) };
  }

  static toHttpList(methods: CardPaymentMethod[]) {
    return { data: methods.map((method) => this.toHttp(method)) };
  }
}
