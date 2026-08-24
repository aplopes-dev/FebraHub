import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  PosDeliveryOrder,
  type PosDeliveryOrderProps,
} from '../../domain/entities/pos-delivery-order.entity';
import {
  PosDeliveryOrderRepository,
  type ListPosDeliveryOrdersCriteria,
} from '../../domain/repositories/pos-delivery-order.repository.interface';

const includeLines = { lines: { orderBy: { id: 'asc' as const } } };
type OrderRow = Prisma.PosDeliveryOrderGetPayload<{
  include: typeof includeLines;
}>;

@Injectable()
export class PrismaPosDeliveryOrderRepository extends PosDeliveryOrderRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(organizationId: string, id: string) {
    const row = await this.prisma.scoped.posDeliveryOrder.findFirst({
      where: { organizationId, id, deletedAt: null },
      include: includeLines,
    });
    return row ? this.toDomain(row) : null;
  }

  async findByIdForBranch(
    organizationId: string,
    branchId: string,
    id: string,
  ) {
    const row = await this.prisma.scoped.posDeliveryOrder.findFirst({
      where: { organizationId, branchId, id, deletedAt: null },
      include: includeLines,
    });
    return row ? this.toDomain(row) : null;
  }

  async list(
    organizationId: string,
    branchId: string,
    criteria: ListPosDeliveryOrdersCriteria,
  ) {
    const search = criteria.search?.trim();
    const numericSearch =
      search && /^\d+$/.test(search) ? Number(search) : null;
    const where: Prisma.PosDeliveryOrderWhereInput = {
      organizationId,
      branchId,
      deletedAt: null,
      ...(criteria.status ? { status: criteria.status } : {}),
      ...(criteria.fulfillment ? { fulfillment: criteria.fulfillment } : {}),
      ...(search
        ? {
            OR: [
              { customerName: { contains: search, mode: 'insensitive' } },
              { addressText: { contains: search, mode: 'insensitive' } },
              ...(numericSearch === null ? [] : [{ number: numericSearch }]),
            ],
          }
        : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.scoped.posDeliveryOrder.count({ where }),
      this.prisma.scoped.posDeliveryOrder.findMany({
        where,
        include: includeLines,
        orderBy: { createdAt: 'desc' },
        skip: (criteria.page - 1) * criteria.perPage,
        take: criteria.perPage,
      }),
    ]);
    return { total, items: rows.map((row) => this.toDomain(row)) };
  }

  async nextNumber(organizationId: string, branchId: string) {
    const result = await this.prisma.scoped.posDeliveryOrder.aggregate({
      where: { organizationId, branchId },
      _max: { number: true },
    });
    return (result._max.number ?? 0) + 1;
  }

  async save(order: PosDeliveryOrder) {
    const existing = await this.prisma.scoped.posDeliveryOrder.findFirst({
      where: { id: order.id, organizationId: order.props.organizationId },
      select: { id: true },
    });
    const row = existing
      ? await this.update(order)
      : await this.createWithAtomicNumber(order);
    return this.toDomain(row);
  }

  async findActiveSaleOrderIds(
    organizationId: string,
    deliveryOrderIds: string[],
  ): Promise<Map<string, string>> {
    const ids = [...new Set(deliveryOrderIds.filter((id) => id.trim()))];
    if (ids.length === 0) return new Map();
    const rows = await this.prisma.scoped.saleOrder.findMany({
      where: {
        organizationId,
        posDeliveryOrderId: { in: ids },
        status: { not: 'cancelled' },
      },
      select: { id: true, posDeliveryOrderId: true },
    });
    const map = new Map<string, string>();
    for (const row of rows) {
      if (row.posDeliveryOrderId) {
        map.set(row.posDeliveryOrderId, row.id);
      }
    }
    return map;
  }

  private async createWithAtomicNumber(order: PosDeliveryOrder) {
    return this.prisma.scoped.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${order.props.organizationId}:${order.props.branchId}:pos-delivery-number`}))`;
      const aggregate = await tx.posDeliveryOrder.aggregate({
        where: {
          organizationId: order.props.organizationId,
          branchId: order.props.branchId,
        },
        _max: { number: true },
      });
      return tx.posDeliveryOrder.create({
        data: {
          id: order.id,
          ...this.data(order),
          number: (aggregate._max.number ?? 0) + 1,
          createdAt: order.props.createdAt,
          lines: { create: this.lineData(order) },
        },
        include: includeLines,
      });
    });
  }

  private update(order: PosDeliveryOrder) {
    return this.prisma.scoped.posDeliveryOrder.update({
      where: { id: order.id },
      data: {
        ...this.data(order),
        lines: { deleteMany: {}, create: this.lineData(order) },
      },
      include: includeLines,
    });
  }

  private data(order: PosDeliveryOrder) {
    const {
      lines: _lines,
      number,
      createdAt: _createdAt,
      ...data
    } = order.props;
    void _lines;
    void _createdAt;
    return { ...data, number };
  }

  private lineData(order: PosDeliveryOrder) {
    // Nested sob o pedido: Prisma herda organizationId/deliveryOrderId do pai
    // (UncheckedCreateWithoutDeliveryOrderInput não aceita organizationId).
    return order.props.lines.map((line) => ({
      productId: line.productId,
      productName: line.productName,
      quantity: line.quantity,
      unitPriceCents: line.unitPriceCents,
      notes: line.notes,
    }));
  }

  private toDomain(row: OrderRow) {
    const props: PosDeliveryOrderProps = {
      organizationId: row.organizationId,
      branchId: row.branchId,
      number: row.number,
      status: row.status,
      fulfillment: row.fulfillment,
      customerId: row.customerId,
      customerName: row.customerName,
      addressZipCode: row.addressZipCode,
      addressStreet: row.addressStreet,
      addressNumber: row.addressNumber,
      addressDistrict: row.addressDistrict,
      addressCity: row.addressCity,
      addressState: row.addressState,
      addressComplement: row.addressComplement,
      addressText: row.addressText,
      feeCents: row.feeCents,
      courierId: row.courierId,
      courierName: row.courierName,
      posTerminalId: row.posTerminalId,
      operatorUserId: row.operatorUserId,
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      lines: row.lines.map((line) => ({
        id: line.id,
        productId: line.productId,
        productName: line.productName,
        quantity: line.quantity.toString(),
        unitPriceCents: line.unitPriceCents,
        notes: line.notes,
      })),
    };
    return PosDeliveryOrder.with(props, row.id);
  }
}
