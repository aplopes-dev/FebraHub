import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../../../generated/prisma/client';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import {
  CardPaymentMethod,
  type CardPaymentMethodProps,
  type CardPaymentMethodType,
} from '../../domain/entities/card-payment-method.entity';
import { CardPaymentMethodRepository } from '../../domain/repositories/card-payment-method.repository.interface';

type DecimalLike = { toString(): string } | number | string;

function toNumber(value: DecimalLike): number {
  if (typeof value === 'number') return value;
  return Number(value.toString());
}

type CardRateTierRow = {
  id: string;
  minInstallments: number;
  maxInstallments: number;
  rate: DecimalLike;
};

type CardPaymentMethodRow = {
  id: string;
  organizationId: string;
  cardContractId: string;
  type: string;
  brand: string | null;
  rate: DecimalLike | null;
  feeCents: number | null;
  settlementDays: number | null;
  minInstallments: number | null;
  maxInstallments: number | null;
  firstPaymentDays: number | null;
  daysBetweenInstallments: number | null;
  progressiveEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  rateTiers: CardRateTierRow[];
};

const paymentMethodInclude = {
  rateTiers: { orderBy: { minInstallments: 'asc' as const } },
} satisfies Prisma.CardPaymentMethodInclude;

@Injectable()
export class PrismaCardPaymentMethodRepository extends CardPaymentMethodRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    organizationId: string,
    cardContractId: string,
    id: string,
  ): Promise<CardPaymentMethod | null> {
    const row = await this.prisma.scoped.cardPaymentMethod.findFirst({
      where: { id, organizationId, cardContractId },
      include: paymentMethodInclude,
    });
    return row ? this.toEntity(row) : null;
  }

  async findAllByContract(
    organizationId: string,
    cardContractId: string,
  ): Promise<CardPaymentMethod[]> {
    const rows = await this.prisma.scoped.cardPaymentMethod.findMany({
      where: { organizationId, cardContractId },
      include: paymentMethodInclude,
      orderBy: [{ type: 'asc' }, { createdAt: 'asc' }],
    });
    return (rows as CardPaymentMethodRow[]).map((row) => this.toEntity(row));
  }

  /**
   * Faixas são substituídas por completo (`deleteMany` + `createMany`) na mesma
   * transação do método: elas não têm identidade estável para o cliente — quem
   * edita o progressivo reenvia o conjunto inteiro, e uma reconciliação linha a
   * linha só adicionaria estado sem ganho.
   */
  async save(method: CardPaymentMethod): Promise<CardPaymentMethod> {
    const data = {
      organizationId: method.organizationId,
      cardContractId: method.cardContractId,
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
      updatedAt: method.updatedAt,
    };

    await this.prisma.scoped.$transaction(async (tx) => {
      await tx.cardPaymentMethod.upsert({
        where: { id: method.id },
        create: { id: method.id, ...data, createdAt: method.createdAt },
        update: data,
      });

      await tx.cardRateTier.deleteMany({
        where: {
          organizationId: method.organizationId,
          cardPaymentMethodId: method.id,
        },
      });

      if (method.rateTiers.length > 0) {
        await tx.cardRateTier.createMany({
          data: method.rateTiers.map((tier) => ({
            id: tier.id,
            organizationId: method.organizationId,
            cardPaymentMethodId: method.id,
            minInstallments: tier.minInstallments,
            maxInstallments: tier.maxInstallments,
            rate: tier.rate,
            updatedAt: method.updatedAt,
          })),
        });
      }
    });

    const saved = await this.findById(
      method.organizationId,
      method.cardContractId,
      method.id,
    );
    if (!saved) {
      throw new Error(`Card payment method ${method.id} missing after save`);
    }
    return saved;
  }

  async delete(
    organizationId: string,
    cardContractId: string,
    id: string,
  ): Promise<void> {
    // As faixas saem por cascade da FK (`CardRateTier.cardPaymentMethod`).
    await this.prisma.scoped.cardPaymentMethod.deleteMany({
      where: { id, organizationId, cardContractId },
    });
  }

  private toEntity(row: CardPaymentMethodRow): CardPaymentMethod {
    const props: CardPaymentMethodProps = {
      organizationId: row.organizationId,
      cardContractId: row.cardContractId,
      type: row.type as CardPaymentMethodType,
      brand: row.brand,
      rate: row.rate === null ? null : toNumber(row.rate),
      feeCents: row.feeCents,
      settlementDays: row.settlementDays,
      minInstallments: row.minInstallments,
      maxInstallments: row.maxInstallments,
      firstPaymentDays: row.firstPaymentDays,
      daysBetweenInstallments: row.daysBetweenInstallments,
      progressiveEnabled: row.progressiveEnabled,
      rateTiers: row.rateTiers.map((tier) => ({
        id: tier.id,
        minInstallments: tier.minInstallments,
        maxInstallments: tier.maxInstallments,
        rate: toNumber(tier.rate),
      })),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return CardPaymentMethod.with(props, row.id);
  }
}
