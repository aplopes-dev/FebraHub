import type { PosDeliveryOrder } from '../../domain/entities/pos-delivery-order.entity';

export type PosDeliveryOrderView = {
  order: PosDeliveryOrder;
  /** Venda ativa (status <> cancelled) vinculada, se houver. */
  saleOrderId: string | null;
};

export class PosDeliveryPresenter {
  static order(view: PosDeliveryOrderView) {
    const { order, saleOrderId } = view;
    return {
      id: order.id,
      ...order.props,
      saleOrderId,
      paid: saleOrderId != null,
      createdAt: order.props.createdAt.toISOString(),
      updatedAt: order.props.updatedAt.toISOString(),
      deletedAt: order.props.deletedAt?.toISOString() ?? null,
      lines: order.props.lines.map((line) => ({ ...line })),
    };
  }

  static single(view: PosDeliveryOrderView) {
    return { data: this.order(view) };
  }

  static list(
    result: { items: PosDeliveryOrderView[]; total: number },
    page: number,
    perPage: number,
  ) {
    return {
      data: result.items.map((item) => this.order(item)),
      meta: {
        total: result.total,
        page,
        perPage,
        totalPages: Math.ceil(result.total / perPage) || 0,
      },
    };
  }
}
