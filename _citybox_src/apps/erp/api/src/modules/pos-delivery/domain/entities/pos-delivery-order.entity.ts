import { Entity } from '../../../../shared/core/entity';
import {
  AddressRequiredError,
  AlreadySoldError,
  CourierRequiredError,
  ImmutableAfterSaleError,
  InvalidStatusTransitionError,
} from '../errors/pos-delivery.errors';

export const POS_DELIVERY_STATUSES = [
  'received',
  'preparing',
  'dispatched',
  'delivered',
  'cancelled',
] as const;
export type PosDeliveryOrderStatus = (typeof POS_DELIVERY_STATUSES)[number];
export const POS_DELIVERY_FULFILLMENTS = ['delivery', 'pickup'] as const;
export type PosDeliveryFulfillment = (typeof POS_DELIVERY_FULFILLMENTS)[number];

export type PosDeliveryOrderLine = {
  id?: string;
  productId: string;
  productName: string;
  quantity: string;
  unitPriceCents: number;
  notes: string;
};

export type PosDeliveryOrderProps = {
  organizationId: string;
  branchId: string;
  number: number;
  status: PosDeliveryOrderStatus;
  fulfillment: PosDeliveryFulfillment;
  customerId: string | null;
  customerName: string;
  addressZipCode: string | null;
  addressStreet: string | null;
  addressNumber: string | null;
  addressDistrict: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressComplement: string | null;
  addressText: string;
  feeCents: number;
  courierId: string | null;
  courierName: string | null;
  posTerminalId: string | null;
  operatorUserId: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lines: PosDeliveryOrderLine[];
};

export type CreatePosDeliveryOrderProps = Omit<
  PosDeliveryOrderProps,
  'status' | 'deletedAt' | 'createdAt' | 'updatedAt'
> &
  Partial<
    Pick<
      PosDeliveryOrderProps,
      'status' | 'deletedAt' | 'createdAt' | 'updatedAt'
    >
  >;

export type UpdatePosDeliveryHeader = Partial<
  Pick<
    PosDeliveryOrderProps,
    | 'fulfillment'
    | 'customerId'
    | 'customerName'
    | 'addressZipCode'
    | 'addressStreet'
    | 'addressNumber'
    | 'addressDistrict'
    | 'addressCity'
    | 'addressState'
    | 'addressComplement'
    | 'addressText'
    | 'feeCents'
    | 'courierId'
    | 'courierName'
  >
>;

const NEXT_STATUS: Partial<
  Record<PosDeliveryOrderStatus, PosDeliveryOrderStatus>
> = {
  received: 'preparing',
  preparing: 'dispatched',
  dispatched: 'delivered',
};

export class PosDeliveryOrder extends Entity<PosDeliveryOrderProps> {
  constructor(props: PosDeliveryOrderProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    if (this.props.feeCents < 0) throw new Error('feeCents must be >= 0');
    if (
      this.props.fulfillment === 'delivery' &&
      !this.props.addressText.trim()
    ) {
      throw new AddressRequiredError();
    }
    for (const line of this.props.lines) {
      if (
        !line.productId.trim() ||
        Number(line.quantity) <= 0 ||
        !Number.isFinite(Number(line.quantity)) ||
        line.unitPriceCents < 0
      ) {
        throw new Error('Invalid delivery order line');
      }
    }
  }

  static create(props: CreatePosDeliveryOrderProps, id?: string) {
    const now = new Date();
    return new PosDeliveryOrder(
      {
        ...props,
        status: props.status ?? 'received',
        deletedAt: props.deletedAt ?? null,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
        lines: props.lines.map((line) => ({ ...line })),
      },
      id,
    );
  }

  static with(props: PosDeliveryOrderProps, id: string) {
    return new PosDeliveryOrder(props, id);
  }

  get number() {
    return this.props.number;
  }
  get status() {
    return this.props.status;
  }
  get fulfillment() {
    return this.props.fulfillment;
  }

  /** Pedido cobrado = há SaleOrder ativa (não este status). Mantido só para
   * legado de testes de máquina de status operacional `delivered`. */
  get isSold() {
    return this.props.status === 'delivered';
  }

  updateHeader(input: UpdatePosDeliveryHeader) {
    this.assertMutable();
    return this.copy({ ...this.props, ...input });
  }

  replaceLines(lines: PosDeliveryOrderLine[]) {
    this.assertMutable();
    return this.copy({
      ...this.props,
      lines: lines.map((line) => ({ ...line })),
    });
  }

  changeStatus(status: PosDeliveryOrderStatus) {
    if (status === this.props.status) return this;
    if (status === 'cancelled') return this.markCancelled();
    if (NEXT_STATUS[this.props.status] !== status) {
      throw new InvalidStatusTransitionError(this.props.status, status);
    }
    if (
      status === 'dispatched' &&
      this.props.fulfillment === 'delivery' &&
      !this.props.courierId
    ) {
      throw new CourierRequiredError();
    }
    return this.copy({ ...this.props, status });
  }

  /** Fecha o ciclo operacional (coluna Concluído). Não implica pagamento. */
  markDelivered() {
    if (this.props.status === 'cancelled') throw new AlreadySoldError();
    if (this.props.status === 'delivered') return this;
    return this.copy({ ...this.props, status: 'delivered' });
  }

  markCancelled() {
    if (this.props.status === 'delivered') throw new AlreadySoldError();
    if (this.props.status === 'cancelled') return this;
    return this.copy({ ...this.props, status: 'cancelled' });
  }

  private assertMutable() {
    if (
      this.props.status === 'delivered' ||
      this.props.status === 'cancelled'
    ) {
      throw new ImmutableAfterSaleError();
    }
  }

  private copy(props: PosDeliveryOrderProps) {
    return PosDeliveryOrder.with(
      {
        ...props,
        updatedAt: new Date(),
        lines: props.lines.map((line) => ({ ...line })),
      },
      this.id,
    );
  }
}
