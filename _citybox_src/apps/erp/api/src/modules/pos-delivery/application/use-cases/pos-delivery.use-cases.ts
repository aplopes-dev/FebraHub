import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  PosDeliveryOrder,
  type PosDeliveryFulfillment,
  type PosDeliveryOrderLine,
  type PosDeliveryOrderStatus,
  type UpdatePosDeliveryHeader,
} from '../../domain/entities/pos-delivery-order.entity';
import {
  AlreadySoldError,
  ImmutableAfterSaleError,
  PosDeliveryOrderNotFoundError,
} from '../../domain/errors/pos-delivery.errors';
import { PosDeliveryOrderRepository } from '../../domain/repositories/pos-delivery-order.repository.interface';

export type CreatePosDeliveryOrderDto = {
  organizationId: string;
  branchId: string;
  fulfillment: PosDeliveryFulfillment;
  customerId?: string | null;
  customerName: string;
  addressZipCode?: string | null;
  addressStreet?: string | null;
  addressNumber?: string | null;
  addressDistrict?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressComplement?: string | null;
  addressText?: string;
  feeCents: number;
  courierId?: string | null;
  courierName?: string | null;
  posTerminalId?: string | null;
  operatorUserId?: string | null;
  lines: Array<Omit<PosDeliveryOrderLine, 'notes'> & { notes?: string }>;
};

type BranchOrderDto = {
  organizationId: string;
  branchId: string;
  id: string;
};

@Injectable()
export class CreatePosDeliveryOrderUseCase {
  constructor(private readonly repository: PosDeliveryOrderRepository) {}

  async execute(input: CreatePosDeliveryOrderDto) {
    const number = await this.repository.nextNumber(
      input.organizationId,
      input.branchId,
    );
    const order = await this.repository.save(
      PosDeliveryOrder.create({
        organizationId: input.organizationId,
        branchId: input.branchId,
        number,
        fulfillment: input.fulfillment,
        customerId: input.customerId ?? null,
        customerName: input.customerName.trim(),
        addressZipCode: input.addressZipCode ?? null,
        addressStreet: input.addressStreet ?? null,
        addressNumber: input.addressNumber ?? null,
        addressDistrict: input.addressDistrict ?? null,
        addressCity: input.addressCity ?? null,
        addressState: input.addressState ?? null,
        addressComplement: input.addressComplement ?? null,
        addressText: input.addressText?.trim() ?? '',
        feeCents: input.feeCents,
        courierId: input.courierId ?? null,
        courierName: input.courierName ?? null,
        posTerminalId: input.posTerminalId ?? null,
        operatorUserId: input.operatorUserId ?? null,
        lines: input.lines.map((line) => ({
          ...line,
          notes: line.notes ?? '',
        })),
      }),
    );
    return { order, saleOrderId: null as string | null };
  }
}

@Injectable()
export class ListPosDeliveryOrdersUseCase {
  constructor(private readonly repository: PosDeliveryOrderRepository) {}
  async execute(input: {
    organizationId: string;
    branchId: string;
    status?: PosDeliveryOrderStatus;
    fulfillment?: PosDeliveryFulfillment;
    search?: string;
    page: number;
    perPage: number;
  }) {
    const result = await this.repository.list(
      input.organizationId,
      input.branchId,
      input,
    );
    const sales = await this.repository.findActiveSaleOrderIds(
      input.organizationId,
      result.items.map((item) => item.id),
    );
    return {
      total: result.total,
      items: result.items.map((order) => ({
        order,
        saleOrderId: sales.get(order.id) ?? null,
      })),
    };
  }
}

@Injectable()
export class GetPosDeliveryOrderUseCase {
  constructor(private readonly repository: PosDeliveryOrderRepository) {}
  async execute(input: BranchOrderDto) {
    const order = await this.repository.findByIdForBranch(
      input.organizationId,
      input.branchId,
      input.id,
    );
    if (!order) throw new PosDeliveryOrderNotFoundError(input.id);
    const sales = await this.repository.findActiveSaleOrderIds(
      input.organizationId,
      [order.id],
    );
    return { order, saleOrderId: sales.get(order.id) ?? null };
  }
}

@Injectable()
export class UpdatePosDeliveryOrderUseCase {
  constructor(private readonly repository: PosDeliveryOrderRepository) {}
  async execute(input: BranchOrderDto & UpdatePosDeliveryHeader) {
    const order = await this.get(input);
    const { organizationId, branchId, id, ...header } = input;
    void organizationId;
    void branchId;
    void id;
    const sales = await this.repository.findActiveSaleOrderIds(
      input.organizationId,
      [order.id],
    );
    if (sales.has(order.id)) {
      // Pago: só entregador pode mudar (cliente/endereço/taxa ficam travados).
      const keys = Object.keys(header) as Array<keyof UpdatePosDeliveryHeader>;
      const nonCourier = keys.filter(
        (key) =>
          key !== 'courierId' &&
          key !== 'courierName' &&
          header[key] !== undefined,
      );
      if (nonCourier.length > 0) {
        throw new ImmutableAfterSaleError();
      }
    }
    const saved = await this.repository.save(order.updateHeader(header));
    return {
      order: saved,
      saleOrderId: sales.get(saved.id) ?? null,
    };
  }
  private async get(input: BranchOrderDto) {
    const order = await this.repository.findByIdForBranch(
      input.organizationId,
      input.branchId,
      input.id,
    );
    if (!order) throw new PosDeliveryOrderNotFoundError(input.id);
    return order;
  }
}

@Injectable()
export class ReplacePosDeliveryOrderLinesUseCase {
  constructor(private readonly repository: PosDeliveryOrderRepository) {}
  async execute(input: BranchOrderDto & { lines: PosDeliveryOrderLine[] }) {
    const order = await this.repository.findByIdForBranch(
      input.organizationId,
      input.branchId,
      input.id,
    );
    if (!order) throw new PosDeliveryOrderNotFoundError(input.id);
    const sales = await this.repository.findActiveSaleOrderIds(
      input.organizationId,
      [order.id],
    );
    if (sales.has(order.id)) {
      throw new ImmutableAfterSaleError();
    }
    const saved = await this.repository.save(order.replaceLines(input.lines));
    return { order: saved, saleOrderId: null as string | null };
  }
}

@Injectable()
export class UpdatePosDeliveryOrderStatusUseCase {
  constructor(private readonly repository: PosDeliveryOrderRepository) {}
  async execute(input: BranchOrderDto & { status: PosDeliveryOrderStatus }) {
    const order = await this.repository.findByIdForBranch(
      input.organizationId,
      input.branchId,
      input.id,
    );
    if (!order) throw new PosDeliveryOrderNotFoundError(input.id);
    if (input.status === 'cancelled') {
      const sales = await this.repository.findActiveSaleOrderIds(
        input.organizationId,
        [order.id],
      );
      if (sales.has(order.id)) {
        throw new AlreadySoldError();
      }
    }
    const saved = await this.repository.save(order.changeStatus(input.status));
    const sales = await this.repository.findActiveSaleOrderIds(
      input.organizationId,
      [saved.id],
    );
    return { order: saved, saleOrderId: sales.get(saved.id) ?? null };
  }
}

export type PosCourier = {
  id: string;
  name: string;
  mobilePhone: string | null;
};

@Injectable()
export class ListPosCouriersUseCase {
  constructor(private readonly prisma: PrismaService) {}
  async execute(input: {
    organizationId: string;
    branchId: string;
  }): Promise<PosCourier[]> {
    return this.prisma.scoped.carrier.findMany({
      where: {
        organizationId: input.organizationId,
        deliveryType: 'entregador',
        deletedAt: null,
        branches: { some: { branchId: input.branchId } },
      },
      select: { id: true, name: true, mobilePhone: true },
      orderBy: { name: 'asc' },
    });
  }
}
