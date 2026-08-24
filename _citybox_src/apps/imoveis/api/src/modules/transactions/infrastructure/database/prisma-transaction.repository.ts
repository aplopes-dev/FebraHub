import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  TransactionEntity,
  type RentalConfig,
  type TransactionStatus,
} from '../../domain/entities/transaction.entity';
import {
  TransactionRepository,
  TRANSACTIONS_AGGREGATE_CAP,
  type CreateTransactionPayload,
  type ListTransactionsFilters,
  type ListTransactionsResult,
  type TransactionActivityInput,
  type UpdateRentalPayoutPayload,
  type UpdateSplitPayload,
  type UpdateTransactionStatusPayload,
} from '../../domain/repositories/transaction.repository.interface';
import {
  formatDateOnly,
  parseDateOnly,
} from '../../application/policies/transaction-date.policy';
import {
  paymentMethodToApi,
  paymentMethodToPrisma,
} from '../../application/policies/transaction-payment-method.policy';
import {
  toCommissionOthers,
  toRentalDeductions,
} from './parse-transaction-json';

type TransactionRow = Prisma.TransactionGetPayload<{
  include: { activities: true };
}>;

const INCLUDE_ACTIVITIES = {
  activities: { orderBy: { at: Prisma.SortOrder.asc } },
} as const;

@Injectable()
export class PrismaTransactionRepository extends TransactionRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findMany(
    storeId: string,
    filters: ListTransactionsFilters,
  ): Promise<ListTransactionsResult> {
    const where = this.buildWhere(storeId, filters);
    const skip = (filters.page - 1) * filters.perPage;
    const [rows, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: INCLUDE_ACTIVITIES,
        orderBy: { createdAt: 'desc' },
        skip,
        take: filters.perPage,
      }),
      this.prisma.transaction.count({ where }),
    ]);
    return { items: rows.map((row) => this.toEntity(row)), total };
  }

  async findById(
    storeId: string,
    id: string,
  ): Promise<TransactionEntity | null> {
    const row = await this.prisma.transaction.findFirst({
      where: { id, storeId },
      include: INCLUDE_ACTIVITIES,
    });
    return row ? this.toEntity(row) : null;
  }

  async findByDealId(
    storeId: string,
    dealId: string,
  ): Promise<TransactionEntity | null> {
    const row = await this.prisma.transaction.findFirst({
      where: { storeId, dealId },
      include: INCLUDE_ACTIVITIES,
    });
    return row ? this.toEntity(row) : null;
  }

  async findOpenByPropertyId(
    storeId: string,
    propertyId: string,
  ): Promise<TransactionEntity[]> {
    const rows = await this.prisma.transaction.findMany({
      where: {
        storeId,
        propertyId,
        status: { in: ['DRAFT', 'PROPOSAL', 'CONTRACT_SIGNED'] },
      },
      include: INCLUDE_ACTIVITIES,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async findTransactionIdsByDealIds(
    storeId: string,
    dealIds: readonly string[],
  ): Promise<Map<string, string>> {
    if (dealIds.length === 0) return new Map();

    const rows = await this.prisma.transaction.findMany({
      where: { storeId, dealId: { in: [...dealIds] } },
      select: { id: true, dealId: true },
      orderBy: { updatedAt: 'desc' },
    });

    const map = new Map<string, string>();
    for (const row of rows) {
      if (row.dealId && !map.has(row.dealId)) map.set(row.dealId, row.id);
    }
    return map;
  }

  async findTransactionIdsByLeadIds(
    storeId: string,
    leadIds: readonly string[],
  ): Promise<Map<string, string>> {
    if (leadIds.length === 0) return new Map();

    const rows = await this.prisma.transaction.findMany({
      where: {
        storeId,
        leadId: { in: [...leadIds] },
        status: { not: 'CANCELLED' },
      },
      select: { id: true, leadId: true },
      orderBy: { updatedAt: 'desc' },
    });

    const map = new Map<string, string>();
    for (const row of rows) {
      if (row.leadId && !map.has(row.leadId)) map.set(row.leadId, row.id);
    }
    return map;
  }

  async countActiveTransactionsByPropertyId(
    storeId: string,
    propertyId: string,
    excludeTransactionId: string,
    statuses: readonly TransactionStatus[] = [
      'PROPOSAL',
      'CONTRACT_SIGNED',
      'COMPLETED',
    ],
  ): Promise<number> {
    if (statuses.length === 0) return 0;
    return this.prisma.transaction.count({
      where: {
        storeId,
        propertyId,
        id: { not: excludeTransactionId },
        status: { in: [...statuses] },
      },
    });
  }

  async findAllForStore(storeId: string): Promise<TransactionEntity[]> {
    const rows = await this.prisma.transaction.findMany({
      where: { storeId },
      include: INCLUDE_ACTIVITIES,
      orderBy: { createdAt: 'desc' },
      take: TRANSACTIONS_AGGREGATE_CAP,
    });
    return rows.map((row) => this.toEntity(row));
  }

  async create(payload: CreateTransactionPayload): Promise<TransactionEntity> {
    const row = await this.prisma.transaction.create({
      data: {
        id: randomUUID(),
        storeId: payload.storeId,
        type: payload.type,
        status: payload.status,
        title: payload.title,
        propertyId: payload.propertyId,
        propertyName: payload.propertyName,
        leadId: payload.leadId,
        leadName: payload.leadName,
        dealId: payload.dealId ?? null,
        captorId: payload.captorId,
        sellerId: payload.sellerId,
        grossValueCents: payload.grossValueCents,
        paymentMethod: paymentMethodToPrisma(payload.paymentMethod),
        commissionPercent: payload.commissionPercent,
        agencyPercent: payload.split.agencyPercent,
        captorPercent: payload.split.captorPercent,
        sellerPercent: payload.split.sellerPercent,
        agencyAmountCents: payload.split.agencyAmountCents,
        captorAmountCents: payload.split.captorAmountCents,
        sellerAmountCents: payload.split.sellerAmountCents,
        totalCommissionCents: payload.split.totalCommissionCents,
        splitOthers: [...payload.split.others] as Prisma.InputJsonValue,
        splitSource: payload.splitSource,
        ...this.rentalData(payload.rental),
        activities: {
          create: [this.activityData(payload.activity)],
        },
      },
      include: INCLUDE_ACTIVITIES,
    });
    return this.toEntity(row);
  }

  async updateSplit(
    storeId: string,
    id: string,
    payload: UpdateSplitPayload,
    activity: TransactionActivityInput,
  ): Promise<TransactionEntity | null> {
    const existing = await this.prisma.transaction.findFirst({
      where: { id, storeId },
      select: { id: true },
    });
    if (!existing) return null;

    const row = await this.prisma.transaction.update({
      where: { id },
      data: {
        commissionPercent: payload.commissionPercent,
        agencyPercent: payload.split.agencyPercent,
        captorPercent: payload.split.captorPercent,
        sellerPercent: payload.split.sellerPercent,
        agencyAmountCents: payload.split.agencyAmountCents,
        captorAmountCents: payload.split.captorAmountCents,
        sellerAmountCents: payload.split.sellerAmountCents,
        totalCommissionCents: payload.split.totalCommissionCents,
        splitOthers: [...payload.split.others] as Prisma.InputJsonValue,
        splitSource: payload.splitSource,
        activities: { create: [this.activityData(activity)] },
      },
      include: INCLUDE_ACTIVITIES,
    });
    return this.toEntity(row);
  }

  async updateRentalPayout(
    storeId: string,
    id: string,
    payload: UpdateRentalPayoutPayload,
    activity: TransactionActivityInput,
  ): Promise<TransactionEntity | null> {
    const existing = await this.prisma.transaction.findFirst({
      where: { id, storeId },
      select: { id: true, rentalPayoutStatus: true },
    });
    if (!existing || existing.rentalPayoutStatus === null) return null;

    const row = await this.prisma.transaction.update({
      where: { id },
      data: {
        rentalPayoutStatus: payload.status,
        rentalPaidAt: payload.paidAt
          ? parseDateOnly(payload.paidAt, 'paidAt')
          : null,
        rentalPayoutAt: payload.payoutAt
          ? parseDateOnly(payload.payoutAt, 'payoutAt')
          : null,
        activities: { create: [this.activityData(activity)] },
      },
      include: INCLUDE_ACTIVITIES,
    });
    return this.toEntity(row);
  }

  async updateStatus(
    storeId: string,
    id: string,
    payload: UpdateTransactionStatusPayload,
    activity: TransactionActivityInput,
  ): Promise<TransactionEntity | null> {
    const existing = await this.prisma.transaction.findFirst({
      where: { id, storeId },
      select: { id: true },
    });
    if (!existing) return null;

    const row = await this.prisma.transaction.update({
      where: { id },
      data: {
        status: payload.status,
        activities: { create: [this.activityData(activity)] },
      },
      include: INCLUDE_ACTIVITIES,
    });
    return this.toEntity(row);
  }

  private activityData(activity: TransactionActivityInput) {
    return {
      id: randomUUID(),
      at: parseDateOnly(activity.at, 'activity.at'),
      actorName: activity.actorName,
      message: activity.message,
    };
  }

  private rentalData(rental: RentalConfig | null) {
    if (!rental) {
      return {
        rentalLandlordName: null,
        rentalTenantName: null,
        rentalBaseRentCents: null,
        rentalCondoCents: null,
        rentalIptuCents: null,
        rentalAdminFeePercent: null,
        rentalDueDay: null,
        rentalPayoutStatus: null,
        rentalReceivedCents: null,
        rentalDeductions: Prisma.DbNull,
        rentalPaidAt: null,
        rentalPayoutAt: null,
      };
    }
    return {
      rentalLandlordName: rental.landlordName,
      rentalTenantName: rental.tenantName,
      rentalBaseRentCents: rental.baseRentCents,
      rentalCondoCents: rental.condoCents,
      rentalIptuCents: rental.iptuCents,
      rentalAdminFeePercent: rental.adminFeePercent,
      rentalDueDay: rental.dueDay,
      rentalPayoutStatus: rental.payoutStatus,
      rentalReceivedCents: rental.receivedCents,
      rentalDeductions: [...rental.deductions] as Prisma.InputJsonValue,
      rentalPaidAt: rental.paidAt
        ? parseDateOnly(rental.paidAt, 'paidAt')
        : null,
      rentalPayoutAt: rental.payoutAt
        ? parseDateOnly(rental.payoutAt, 'payoutAt')
        : null,
    };
  }

  private buildWhere(
    storeId: string,
    filters: ListTransactionsFilters,
  ): Prisma.TransactionWhereInput {
    const and: Prisma.TransactionWhereInput[] = [{ storeId }];

    if (filters.search) {
      const contains = filters.search;
      and.push({
        OR: [
          { title: { contains, mode: 'insensitive' } },
          { propertyName: { contains, mode: 'insensitive' } },
          { leadName: { contains, mode: 'insensitive' } },
          { captorId: { contains, mode: 'insensitive' } },
          { sellerId: { contains, mode: 'insensitive' } },
        ],
      });
    }
    if (filters.type?.length) {
      and.push({ type: { in: filters.type } });
    }
    if (filters.status?.length) {
      and.push({ status: { in: filters.status } });
    }
    if (filters.agentId) {
      and.push({
        OR: [{ captorId: filters.agentId }, { sellerId: filters.agentId }],
      });
    }
    if (filters.periodFrom) {
      and.push({ createdAt: { gte: filters.periodFrom } });
    }
    if (filters.periodToExclusive) {
      and.push({ createdAt: { lt: filters.periodToExclusive } });
    }

    return { AND: and };
  }

  private toEntity(row: TransactionRow): TransactionEntity {
    const rental: RentalConfig | null =
      row.rentalPayoutStatus !== null
        ? {
            landlordName: row.rentalLandlordName ?? '',
            tenantName: row.rentalTenantName ?? '',
            baseRentCents: row.rentalBaseRentCents ?? 0,
            condoCents: row.rentalCondoCents ?? 0,
            iptuCents: row.rentalIptuCents ?? 0,
            adminFeePercent: row.rentalAdminFeePercent ?? 0,
            dueDay: row.rentalDueDay ?? 1,
            payoutStatus: row.rentalPayoutStatus,
            receivedCents: row.rentalReceivedCents ?? 0,
            deductions: toRentalDeductions(row.rentalDeductions),
            paidAt: row.rentalPaidAt
              ? formatDateOnly(row.rentalPaidAt)
              : undefined,
            payoutAt: row.rentalPayoutAt
              ? formatDateOnly(row.rentalPayoutAt)
              : undefined,
          }
        : null;

    return TransactionEntity.create(
      {
        storeId: row.storeId,
        type: row.type,
        status: row.status,
        title: row.title,
        propertyId: row.propertyId,
        propertyName: row.propertyName,
        leadId: row.leadId,
        leadName: row.leadName,
        dealId: row.dealId,
        captorId: row.captorId,
        sellerId: row.sellerId,
        grossValueCents: row.grossValueCents,
        paymentMethod: paymentMethodToApi(row.paymentMethod),
        commissionPercent: row.commissionPercent,
        split: {
          agencyPercent: row.agencyPercent,
          captorPercent: row.captorPercent,
          sellerPercent: row.sellerPercent,
          others: toCommissionOthers(row.splitOthers),
          agencyAmountCents: row.agencyAmountCents,
          captorAmountCents: row.captorAmountCents,
          sellerAmountCents: row.sellerAmountCents,
          totalCommissionCents: row.totalCommissionCents,
        },
        splitSource: row.splitSource,
        rental,
        activityLog: row.activities.map((activity) => ({
          id: activity.id,
          at: formatDateOnly(activity.at),
          actorName: activity.actorName,
          message: activity.message,
        })),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }
}
