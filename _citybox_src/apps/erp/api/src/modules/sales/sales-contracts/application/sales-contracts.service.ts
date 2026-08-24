import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  resolvePagination,
  type Pagination,
} from '../../../tenancy/application/pagination';
import type { SalesContractWritableHttpDto } from '../http/dto';

@Injectable()
export class SalesContractsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    organizationId: string,
    params: {
      search?: string;
      statusId?: string;
      page?: number;
      perPage?: number;
    },
  ) {
    const where = this.buildWhere(organizationId, params);
    const total = await this.prisma.scoped.salesContract.count({ where });
    const pagination: Pagination = resolvePagination(
      total,
      params.page,
      params.perPage,
    );

    const rows = await this.prisma.scoped.salesContract.findMany({
      where,
      include: { status: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.perPage,
    });

    return {
      data: rows.map((row) => this.toHttp(row)),
      meta: {
        total,
        page: pagination.page,
        perPage: pagination.perPage,
        totalPages: pagination.totalPages,
      },
    };
  }

  async findById(organizationId: string, id: string) {
    const row = await this.prisma.scoped.salesContract.findFirst({
      where: { id, organizationId },
      include: {
        status: { select: { name: true } },
        installments: { orderBy: { sequence: 'asc' } },
      },
    });
    if (!row) throw new NotFoundException('Contrato não encontrado');
    return this.toHttp(row, true);
  }

  async create(organizationId: string, dto: SalesContractWritableHttpDto) {
    await this.assertStatusExists(organizationId, dto.statusId);
    const number = await this.nextNumber(organizationId);

    const contract = await this.prisma.scoped.$transaction(async (tx) => {
      const created = await tx.salesContract.create({
        data: {
          organizationId,
          number,
          customerId: dto.customerId ?? null,
          customerName: dto.customerName.trim(),
          statusId: dto.statusId,
          sellerName: dto.sellerName?.trim() ?? '',
          startsAt: new Date(dto.startsAt),
          endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
          totalCents: dto.totalCents,
          frequency: dto.frequency ?? 'monthly',
          durationType: dto.durationType ?? 'times',
          durationValue: dto.durationValue ?? 12,
          firstDueDate: new Date(dto.firstDueDate),
          payloadJson: (dto.payloadJson ?? {}) as Prisma.InputJsonValue,
        },
      });

      await this.createInstallments(tx, organizationId, created);
      return created;
    });

    return this.findById(organizationId, contract.id);
  }

  async update(
    organizationId: string,
    id: string,
    dto: SalesContractWritableHttpDto,
  ) {
    await this.assertStatusExists(organizationId, dto.statusId);

    await this.prisma.scoped.$transaction(async (tx) => {
      const updated = await tx.salesContract.update({
        where: { id, organizationId },
        data: {
          customerId: dto.customerId ?? null,
          customerName: dto.customerName.trim(),
          statusId: dto.statusId,
          sellerName: dto.sellerName?.trim() ?? '',
          startsAt: new Date(dto.startsAt),
          endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
          totalCents: dto.totalCents,
          frequency: dto.frequency ?? 'monthly',
          durationType: dto.durationType ?? 'times',
          durationValue: dto.durationValue ?? 12,
          firstDueDate: new Date(dto.firstDueDate),
          payloadJson: (dto.payloadJson ?? {}) as Prisma.InputJsonValue,
        },
      });

      // Só regenera as parcelas se nenhuma já tiver saído do estado `open` —
      // preserva histórico financeiro de contratos já em cobrança.
      const nonOpen = await tx.contractInstallment.findFirst({
        where: { contractId: id, organizationId, status: { not: 'open' } },
        select: { id: true },
      });
      if (!nonOpen) {
        await tx.contractInstallment.deleteMany({
          where: { contractId: id, organizationId },
        });
        await this.createInstallments(tx, organizationId, updated);
      }
    });

    return this.findById(organizationId, id);
  }

  private async createInstallments(
    tx: any,
    organizationId: string,
    contract: {
      id: string;
      totalCents: number;
      frequency: string;
      durationType: string;
      durationValue: number;
      firstDueDate: Date;
    },
  ): Promise<void> {
    const count =
      contract.durationType === 'times'
        ? Math.max(1, contract.durationValue)
        : 1;
    const baseAmount = Math.floor(contract.totalCents / count);
    const remainder = contract.totalCents - baseAmount * count;

    const installments = Array.from({ length: count }, (_, index) => {
      const dueDate = new Date(contract.firstDueDate);
      if (contract.frequency === 'yearly') {
        dueDate.setFullYear(dueDate.getFullYear() + index);
      } else {
        dueDate.setMonth(dueDate.getMonth() + index);
      }
      return {
        organizationId,
        contractId: contract.id,
        sequence: index + 1,
        dueDate,
        amountCents: baseAmount + (index === count - 1 ? remainder : 0),
        status: 'open',
      };
    });

    await tx.contractInstallment.createMany({ data: installments });
  }

  private async assertStatusExists(organizationId: string, statusId: string) {
    const found = await this.prisma.scoped.contractStatus.findFirst({
      where: { id: statusId, organizationId },
      select: { id: true },
    });
    if (!found)
      throw new NotFoundException('Status de contrato não encontrado');
  }

  private async nextNumber(organizationId: string): Promise<number> {
    const result = await this.prisma.scoped.salesContract.aggregate({
      where: { organizationId },
      _max: { number: true },
    });
    return (result._max.number ?? 0) + 1;
  }

  private buildWhere(
    organizationId: string,
    params: { search?: string; statusId?: string },
  ) {
    const and: Record<string, unknown>[] = [{ deletedAt: null }];
    if (params.statusId) and.push({ statusId: params.statusId });
    if (params.search?.trim()) {
      and.push({
        customerName: {
          contains: params.search.trim(),
          mode: 'insensitive',
        },
      });
    }
    return { organizationId, AND: and };
  }

  private toHttp(
    row: {
      id: string;
      number: number;
      customerId: string | null;
      customerName: string;
      statusId: string;
      status: { name: string } | null;
      sellerName: string;
      startsAt: Date;
      endsAt: Date | null;
      totalCents: number;
      frequency: string;
      durationType: string;
      durationValue: number;
      firstDueDate: Date;
      payloadJson: unknown;
      deletedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
      installments?: {
        id: string;
        sequence: number;
        dueDate: Date;
        amountCents: number;
        status: string;
      }[];
    },
    withInstallments = false,
  ) {
    return {
      id: row.id,
      number: row.number,
      customerId: row.customerId,
      customerName: row.customerName,
      statusId: row.statusId,
      statusName: row.status?.name ?? null,
      sellerName: row.sellerName,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt?.toISOString() ?? null,
      totalCents: row.totalCents,
      frequency: row.frequency,
      durationType: row.durationType,
      durationValue: row.durationValue,
      firstDueDate: row.firstDueDate.toISOString(),
      payloadJson: row.payloadJson,
      deletedAt: row.deletedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      ...(withInstallments
        ? {
            installments: (row.installments ?? []).map((installment) => ({
              id: installment.id,
              sequence: installment.sequence,
              dueDate: installment.dueDate.toISOString(),
              amountCents: installment.amountCents,
              status: installment.status,
            })),
          }
        : {}),
    };
  }
}
