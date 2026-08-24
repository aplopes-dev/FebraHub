import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../../../generated/prisma/client';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import {
  CardContract,
  type CardContractGrouping,
  type CardContractProps,
  type CardCutoffPeriod,
  type CardDayType,
  type CardInstallmentDayType,
} from '../../domain/entities/card-contract.entity';
import {
  CardContractRepository,
  type CardContractListCriteria,
  type CardContractTabCounts,
  type CardContractWithPaymentMethodCount,
} from '../../domain/repositories/card-contract.repository.interface';

/** Prisma devolve `Decimal`; o domínio trabalha com `number`. */
type DecimalLike = { toString(): string } | number | string;

function toNumber(value: DecimalLike): number {
  if (typeof value === 'number') return value;
  return Number(value.toString());
}

type CardContractRow = {
  id: string;
  organizationId: string;
  provider: string;
  bankAccountId: string | null;
  description: string;
  grouping: string;
  cutoffPeriod: string;
  firstPaymentDayType: string;
  installmentDayType: string;
  businessDaysOnly: boolean;
  depositFeeCents: number;
  anticipationPeriods: number;
  anticipationRate: DecimalLike;
  allEntriesPaidInContract: boolean;
  businessDaysDeposit: boolean;
  active: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: { paymentMethods: number };
};

const paymentMethodCountInclude = {
  _count: { select: { paymentMethods: true } },
} satisfies Prisma.CardContractInclude;

/**
 * Usa `prisma.scoped`: o filtro global injeta o `organizationId` do contexto em
 * toda query, mesmo nas que já o passam explicitamente aqui. As duas travas são
 * de propósito — uma pega o esquecimento, a outra o bug de chamada.
 */
@Injectable()
export class PrismaCardContractRepository extends CardContractRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<CardContractWithPaymentMethodCount | null> {
    // Inclui os excluídos de propósito: a aba "Excluídos" da listagem leva até
    // o detalhe deles, e restaurar precisa encontrá-los.
    const row = await this.prisma.scoped.cardContract.findFirst({
      where: { id, organizationId },
      include: paymentMethodCountInclude,
    });
    return row ? this.toListItem(row) : null;
  }

  async findAll(
    organizationId: string,
    criteria: CardContractListCriteria = {},
  ): Promise<CardContractWithPaymentMethodCount[]> {
    const rows = await this.prisma.scoped.cardContract.findMany({
      where: this.buildWhere(organizationId, criteria),
      include: paymentMethodCountInclude,
      orderBy: { provider: 'asc' },
      skip: criteria.skip,
      take: criteria.take,
    });
    return rows.map((row) => this.toListItem(row));
  }

  count(
    organizationId: string,
    criteria: Omit<CardContractListCriteria, 'skip' | 'take'> = {},
  ): Promise<number> {
    return this.prisma.scoped.cardContract.count({
      where: this.buildWhere(organizationId, criteria),
    });
  }

  async countByTabs(organizationId: string): Promise<CardContractTabCounts> {
    const [active, deleted] = await Promise.all([
      this.prisma.scoped.cardContract.count({
        where: { organizationId, deletedAt: null },
      }),
      this.prisma.scoped.cardContract.count({
        where: { organizationId, deletedAt: { not: null } },
      }),
    ]);
    return { active, deleted };
  }

  async save(contract: CardContract): Promise<CardContract> {
    const data = {
      organizationId: contract.organizationId,
      provider: contract.provider,
      bankAccountId: contract.bankAccountId,
      description: contract.description,
      grouping: contract.grouping,
      cutoffPeriod: contract.cutoffPeriod,
      firstPaymentDayType: contract.firstPaymentDayType,
      installmentDayType: contract.installmentDayType,
      businessDaysOnly: contract.businessDaysOnly,
      depositFeeCents: contract.depositFeeCents,
      anticipationPeriods: contract.anticipationPeriods,
      anticipationRate: contract.anticipationRate,
      allEntriesPaidInContract: contract.allEntriesPaidInContract,
      businessDaysDeposit: contract.businessDaysDeposit,
      active: contract.active,
      deletedAt: contract.deletedAt,
      updatedAt: contract.updatedAt,
    };

    const row = await this.prisma.scoped.cardContract.upsert({
      where: { id: contract.id },
      create: { id: contract.id, ...data, createdAt: contract.createdAt },
      update: data,
    });

    return this.toEntity(row);
  }

  async softDelete(
    organizationId: string,
    id: string,
    deletedAt: Date,
  ): Promise<void> {
    await this.prisma.scoped.cardContract.updateMany({
      where: { id, organizationId },
      data: { deletedAt, updatedAt: deletedAt },
    });
  }

  async clearDeletedAt(
    organizationId: string,
    id: string,
    updatedAt: Date,
  ): Promise<void> {
    await this.prisma.scoped.cardContract.updateMany({
      where: { id, organizationId },
      data: { deletedAt: null, updatedAt },
    });
  }

  private buildWhere(
    organizationId: string,
    criteria: Omit<CardContractListCriteria, 'skip' | 'take'>,
  ): Prisma.CardContractWhereInput {
    const and: Prisma.CardContractWhereInput[] = [];
    const search = criteria.search?.trim();

    and.push(
      criteria.tab === 'deleted'
        ? { deletedAt: { not: null } }
        : { deletedAt: null },
    );

    if (search) {
      and.push({ provider: { contains: search, mode: 'insensitive' } });
    }

    return { organizationId, AND: and };
  }

  private toListItem(row: CardContractRow): CardContractWithPaymentMethodCount {
    return {
      contract: this.toEntity(row),
      paymentMethodCount: row._count?.paymentMethods ?? 0,
    };
  }

  private toEntity(row: CardContractRow): CardContract {
    const props: CardContractProps = {
      organizationId: row.organizationId,
      provider: row.provider,
      bankAccountId: row.bankAccountId,
      description: row.description,
      grouping: row.grouping as CardContractGrouping,
      cutoffPeriod: row.cutoffPeriod as CardCutoffPeriod,
      firstPaymentDayType: row.firstPaymentDayType as CardDayType,
      installmentDayType: row.installmentDayType as CardInstallmentDayType,
      businessDaysOnly: row.businessDaysOnly,
      depositFeeCents: row.depositFeeCents,
      anticipationPeriods: row.anticipationPeriods,
      anticipationRate: toNumber(row.anticipationRate),
      allEntriesPaidInContract: row.allEntriesPaidInContract,
      businessDaysDeposit: row.businessDaysDeposit,
      active: row.active,
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return CardContract.with(props, row.id);
  }
}
