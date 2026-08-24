import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../../../generated/prisma/client';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import {
  PaymentMethod,
  type PaymentMethodProps,
} from '../../domain/entities/payment-method.entity';
import {
  PaymentMethodRepository,
  type PaymentMethodListCriteria,
  type PaymentMethodTabCounts,
} from '../../domain/repositories/payment-method.repository.interface';

type PaymentMethodRow = {
  id: string;
  organizationId: string;
  name: string;
  fiscalCode: string | null;
  installmentPermission: string | null;
  systemKey: string | null;
  isSystem: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Usa `prisma.scoped`: o filtro global injeta o `organizationId` do contexto em
 * toda query, mesmo nas que já o passam explicitamente aqui. As duas travas são
 * de propósito — uma pega o esquecimento, a outra o bug de chamada.
 */
@Injectable()
export class PrismaPaymentMethodRepository extends PaymentMethodRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<PaymentMethod | null> {
    // Inclui os excluídos de propósito: a aba "Excluídos" da listagem leva até
    // o detalhe deles, e restaurar precisa encontrá-los.
    const row = await this.prisma.scoped.paymentMethod.findFirst({
      where: { id, organizationId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByName(
    organizationId: string,
    name: string,
  ): Promise<PaymentMethod | null> {
    const trimmed = name.trim();
    if (!trimmed) return null;

    // Inclui os excluídos de propósito: o unique do banco
    // (`organizationId, name`) não conhece soft-delete. Filtrar aqui faria a
    // checagem passar e o INSERT estourar como 500 — o cliente deve restaurar.
    const row = await this.prisma.scoped.paymentMethod.findFirst({
      where: {
        organizationId,
        name: { equals: trimmed, mode: 'insensitive' },
      },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByIds(
    organizationId: string,
    ids: string[],
  ): Promise<PaymentMethod[]> {
    if (ids.length === 0) return [];
    const rows = await this.prisma.scoped.paymentMethod.findMany({
      where: { organizationId, id: { in: ids } },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async findAll(
    organizationId: string,
    criteria: PaymentMethodListCriteria = {},
  ): Promise<PaymentMethod[]> {
    const rows = await this.prisma.scoped.paymentMethod.findMany({
      where: this.buildWhere(organizationId, criteria),
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
      skip: criteria.skip,
      take: criteria.take,
    });
    return rows.map((row) => this.toEntity(row));
  }

  count(
    organizationId: string,
    criteria: Omit<PaymentMethodListCriteria, 'skip' | 'take'> = {},
  ): Promise<number> {
    return this.prisma.scoped.paymentMethod.count({
      where: this.buildWhere(organizationId, criteria),
    });
  }

  async countByTabs(organizationId: string): Promise<PaymentMethodTabCounts> {
    const [active, deleted] = await Promise.all([
      this.prisma.scoped.paymentMethod.count({
        where: { organizationId, deletedAt: null },
      }),
      this.prisma.scoped.paymentMethod.count({
        where: { organizationId, deletedAt: { not: null } },
      }),
    ]);
    return { active, deleted };
  }

  countUsage(organizationId: string, id: string): Promise<number> {
    return this.prisma.scoped.financialEntryPayment.count({
      where: { organizationId, paymentMethod: id },
    });
  }

  async save(paymentMethod: PaymentMethod): Promise<PaymentMethod> {
    const data = {
      organizationId: paymentMethod.organizationId,
      name: paymentMethod.name,
      fiscalCode: paymentMethod.fiscalCode,
      installmentPermission: paymentMethod.installmentPermission,
      deletedAt: paymentMethod.deletedAt,
      updatedAt: paymentMethod.updatedAt,
    };

    const row = await this.prisma.scoped.paymentMethod.upsert({
      where: { id: paymentMethod.id },
      create: {
        id: paymentMethod.id,
        ...data,
        createdAt: paymentMethod.createdAt,
      },
      update: data,
    });

    return this.toEntity(row);
  }

  async softDelete(
    organizationId: string,
    id: string,
    deletedAt: Date,
  ): Promise<void> {
    await this.prisma.scoped.paymentMethod.updateMany({
      where: { id, organizationId },
      data: { deletedAt, updatedAt: deletedAt },
    });
  }

  async clearDeletedAt(
    organizationId: string,
    id: string,
    updatedAt: Date,
  ): Promise<void> {
    await this.prisma.scoped.paymentMethod.updateMany({
      where: { id, organizationId },
      data: { deletedAt: null, updatedAt },
    });
  }

  private buildWhere(
    organizationId: string,
    criteria: Omit<PaymentMethodListCriteria, 'skip' | 'take'>,
  ): Prisma.PaymentMethodWhereInput {
    const and: Prisma.PaymentMethodWhereInput[] = [];
    const search = criteria.search?.trim();

    and.push(
      criteria.tab === 'deleted'
        ? { deletedAt: { not: null } }
        : { deletedAt: null },
    );

    if (search) {
      and.push({ name: { contains: search, mode: 'insensitive' } });
    }

    return { organizationId, AND: and };
  }

  private toEntity(row: PaymentMethodRow): PaymentMethod {
    const props: PaymentMethodProps = {
      organizationId: row.organizationId,
      name: row.name,
      fiscalCode: row.fiscalCode,
      installmentPermission: row.installmentPermission,
      systemKey: row.systemKey,
      isSystem: row.isSystem,
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return PaymentMethod.with(props, row.id);
  }
}
