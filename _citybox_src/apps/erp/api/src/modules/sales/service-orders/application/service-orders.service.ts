import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import type { Prisma } from '../../../../../generated/prisma/client';
import {
  resolvePagination,
  type Pagination,
} from '../../../tenancy/application/pagination';
import { SaleOrder } from '../../domain/entities/sale-order.entity';
import { SaleOrderRepository } from '../../domain/repositories/sale-order.repository.interface';
import type { ServiceOrderWritableHttpDto } from '../http/dto';
import type { SaleOrderPaymentHttpDto } from '../../infrastructure/http/routes/shared/sale-order.dto';
import { extractServiceOrderSaleLines } from './extract-service-order-sale-lines';

/**
 * Módulo fino de Ordens de Serviço — acesso direto ao Prisma (sem
 * domain/repository próprios) para viabilizar CRUD + geração de venda
 * rapidamente. `payloadJson` carrega equipamentos/linhas livres.
 */
@Injectable()
export class ServiceOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly saleOrderRepository: SaleOrderRepository,
  ) {}

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
    const total = await this.prisma.scoped.serviceOrder.count({ where });
    const pagination: Pagination = resolvePagination(
      total,
      params.page,
      params.perPage,
    );

    const rows = await this.prisma.scoped.serviceOrder.findMany({
      where,
      include: { status: { select: { name: true, baseType: true } } },
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
    const row = await this.prisma.scoped.serviceOrder.findFirst({
      where: { id, organizationId },
      include: { status: { select: { name: true, baseType: true } } },
    });
    if (!row) throw new NotFoundException('Ordem de serviço não encontrada');
    return this.toHttp(row);
  }

  async create(organizationId: string, dto: ServiceOrderWritableHttpDto) {
    await this.assertStatusExists(organizationId, dto.statusId);
    const code = await this.nextCode(organizationId);

    const row = await this.prisma.scoped.serviceOrder.create({
      data: {
        organizationId,
        code,
        customerId: dto.customerId ?? null,
        customerName: dto.customerName.trim(),
        customerPhone: dto.customerPhone?.trim() ?? '',
        statusId: dto.statusId,
        sellerName: dto.sellerName?.trim() ?? '',
        technicianName: dto.technicianName?.trim() ?? '',
        openedAt: new Date(dto.openedAt),
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        totalCents: dto.totalCents ?? 0,
        budgetedCents: dto.budgetedCents ?? 0,
        diagnosisFeeCents: dto.diagnosisFeeCents ?? 0,
        approvalStatus: dto.approvalStatus ?? 'pending',
        approvalNotes: dto.approvalNotes?.trim() ?? '',
        payloadJson: (dto.payloadJson ?? {}) as Prisma.InputJsonValue,
      },
      include: { status: { select: { name: true, baseType: true } } },
    });

    return this.toHttp(row);
  }

  async update(
    organizationId: string,
    id: string,
    dto: ServiceOrderWritableHttpDto,
  ) {
    await this.assertExists(organizationId, id);
    await this.assertStatusExists(organizationId, dto.statusId);

    const row = await this.prisma.scoped.serviceOrder.update({
      where: { id, organizationId },
      data: {
        customerId: dto.customerId ?? null,
        customerName: dto.customerName.trim(),
        customerPhone: dto.customerPhone?.trim() ?? '',
        statusId: dto.statusId,
        sellerName: dto.sellerName?.trim() ?? '',
        technicianName: dto.technicianName?.trim() ?? '',
        openedAt: new Date(dto.openedAt),
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        totalCents: dto.totalCents ?? 0,
        budgetedCents: dto.budgetedCents ?? 0,
        diagnosisFeeCents: dto.diagnosisFeeCents ?? 0,
        approvalStatus: dto.approvalStatus ?? 'pending',
        approvalNotes: dto.approvalNotes?.trim() ?? '',
        payloadJson: (dto.payloadJson ?? {}) as Prisma.InputJsonValue,
      },
      include: { status: { select: { name: true, baseType: true } } },
    });

    return this.toHttp(row);
  }

  /**
   * Gera um `SaleOrder` fechado a partir da OS e grava `generatedSaleId`.
   * Idempotente: se já houver `generatedSaleId`, devolve o mesmo pedido sem
   * criar de novo. As linhas vêm de `payloadJson.lines`.
   */
  async generateSale(
    organizationId: string,
    id: string,
    createdByUserId: string,
    createdByName: string,
    payments?: SaleOrderPaymentHttpDto[],
  ) {
    const row = await this.prisma.scoped.serviceOrder.findFirst({
      where: { id, organizationId },
    });
    if (!row) throw new NotFoundException('Ordem de serviço não encontrada');

    if (row.generatedSaleId) {
      const existing = await this.saleOrderRepository.findById(
        organizationId,
        row.generatedSaleId,
      );
      if (existing) return existing.saleOrder;
    }

    const lines = extractServiceOrderSaleLines(row.payloadJson);
    if (lines.length === 0) {
      throw new BadRequestException(
        'A OS precisa de ao menos uma linha em payloadJson.lines para gerar a venda.',
      );
    }

    const number = await this.saleOrderRepository.nextNumber(organizationId);
    const saleOrder = SaleOrder.create({
      organizationId,
      number,
      customerId: row.customerId,
      customerName: row.customerName,
      status: 'closed',
      createdByName,
      notes: `Gerado da OS ${row.code}`,
      lines,
      // Bugfix (2026-08-20): sem pagamentos, `maybeCreateReceivable`
      // (motor de recebíveis) nunca dispara e nenhum `FinancialEntry` de
      // fornecimento de serviço é criado — a venda ficava fechada, mas
      // "invisível" para o financeiro.
      payments: payments?.map((payment) => ({
        id: payment.id,
        amountCents: payment.amountCents,
        methodId: payment.methodId,
        bankAccountId: payment.bankAccountId ?? null,
        cardPaymentType: payment.cardPaymentType,
        brand: payment.brand,
        installments: payment.installments,
      })),
    });

    const saved = await this.saleOrderRepository.saveWithOptionalMovement(
      saleOrder,
      null,
    );

    await this.prisma.scoped.serviceOrder.update({
      where: { id, organizationId },
      data: { generatedSaleId: saved.id },
    });

    return saved;
  }

  private async assertExists(organizationId: string, id: string) {
    const found = await this.prisma.scoped.serviceOrder.findFirst({
      where: { id, organizationId },
      select: { id: true },
    });
    if (!found) throw new NotFoundException('Ordem de serviço não encontrada');
  }

  private async assertStatusExists(organizationId: string, statusId: string) {
    const found = await this.prisma.scoped.serviceOrderStatus.findFirst({
      where: { id: statusId, organizationId },
      select: { id: true },
    });
    if (!found) throw new NotFoundException('Status de OS não encontrado');
  }

  private async nextCode(organizationId: string): Promise<string> {
    const count = await this.prisma.scoped.serviceOrder.count({
      where: { organizationId },
    });
    return `OS-${String(count + 1).padStart(6, '0')}`;
  }

  private buildWhere(
    organizationId: string,
    params: { search?: string; statusId?: string },
  ) {
    const and: Record<string, unknown>[] = [];
    if (params.statusId) and.push({ statusId: params.statusId });
    if (params.search?.trim()) {
      and.push({
        OR: [
          { code: { contains: params.search.trim(), mode: 'insensitive' } },
          {
            customerName: {
              contains: params.search.trim(),
              mode: 'insensitive',
            },
          },
        ],
      });
    }
    return { organizationId, AND: and };
  }

  private toHttp(row: {
    id: string;
    code: string;
    customerId: string | null;
    customerName: string;
    customerPhone: string;
    statusId: string;
    status: { name: string; baseType: string } | null;
    sellerName: string;
    technicianName: string;
    openedAt: Date;
    dueAt: Date | null;
    totalCents: number;
    budgetedCents: number;
    diagnosisFeeCents: number;
    approvalStatus: string;
    approvalNotes: string;
    generatedSaleId: string | null;
    payloadJson: unknown;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      code: row.code,
      customerId: row.customerId,
      customerName: row.customerName,
      customerPhone: row.customerPhone,
      statusId: row.statusId,
      statusName: row.status?.name ?? null,
      statusBaseType: row.status?.baseType ?? null,
      sellerName: row.sellerName,
      technicianName: row.technicianName,
      openedAt: row.openedAt.toISOString(),
      dueAt: row.dueAt?.toISOString() ?? null,
      totalCents: row.totalCents,
      budgetedCents: row.budgetedCents,
      diagnosisFeeCents: row.diagnosisFeeCents,
      approvalStatus: row.approvalStatus,
      approvalNotes: row.approvalNotes,
      generatedSaleId: row.generatedSaleId,
      payloadJson: row.payloadJson,
      deletedAt: row.deletedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
