import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  FiscalGroup,
  type FiscalGroupProps,
  type FiscalGroupUfRate,
  type FiscalTaxType,
  type UfRateType,
} from '../../domain/entities/fiscal-group.entity';
import {
  FiscalGroupRepository,
  type FiscalGroupProductRef,
} from '../../domain/repositories/fiscal-group.repository.interface';

type DecimalLike = { toString(): string } | number | string | null;

/** FK de `ProductFiscal` que aponta pro grupo, por tributo. */
const TAX_TYPE_FK = {
  ICMS: 'icmsGroupId',
  IPI: 'ipiGroupId',
  PIS_COFINS: 'pisCofinsGroupId',
  ISSQN: 'issqnGroupId',
} as const satisfies Record<FiscalTaxType, string>;

type UfRateRow = {
  uf: string;
  rateType: string;
  aliquota: DecimalLike;
};

type Row = {
  id: string;
  organizationId: string;
  taxType: string;
  name: string;
  pisCst: string | null;
  pisAliquota: DecimalLike;
  cofinsCst: string | null;
  cofinsAliquota: DecimalLike;
  icmsCst: string | null;
  icmsCsosn: string | null;
  issqnServiceCode: string | null;
  issqnNationalCode: string | null;
  issqnRate: DecimalLike;
  issqnTribType: string | null;
  ipiCst: string | null;
  ipiEnquadramento: string | null;
  ipiRate: DecimalLike;
  createdAt: Date;
  updatedAt: Date;
  ufRates?: UfRateRow[];
};

function toNullableNumber(value: DecimalLike): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  return Number(value.toString());
}

function toNumber(value: DecimalLike): number {
  return toNullableNumber(value) ?? 0;
}

@Injectable()
export class PrismaFiscalGroupRepository extends FiscalGroupRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async listByOrganization(
    organizationId: string,
    taxType?: FiscalTaxType,
  ): Promise<FiscalGroup[]> {
    const rows = await this.prisma.scoped.fiscalGroup.findMany({
      where: { organizationId, ...(taxType ? { taxType } : {}) },
      include: { ufRates: true },
      orderBy: { name: 'asc' },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<FiscalGroup | null> {
    const row = await this.prisma.scoped.fiscalGroup.findFirst({
      where: { id, organizationId },
      include: { ufRates: true },
    });
    return row ? this.toEntity(row) : null;
  }

  async save(group: FiscalGroup): Promise<FiscalGroup> {
    const data = {
      taxType: group.taxType,
      name: group.name,
      pisCst: group.pisCst,
      pisAliquota: group.pisAliquota,
      cofinsCst: group.cofinsCst,
      cofinsAliquota: group.cofinsAliquota,
      icmsCst: group.icmsCst,
      icmsCsosn: group.icmsCsosn,
      issqnServiceCode: group.issqnServiceCode,
      issqnNationalCode: group.issqnNationalCode,
      issqnRate: group.issqnRate,
      issqnTribType: group.issqnTribType,
      ipiCst: group.ipiCst,
      ipiEnquadramento: group.ipiEnquadramento,
      ipiRate: group.ipiRate,
      updatedAt: group.updatedAt,
    };

    const saved = await this.prisma.scoped.$transaction(async (tx) => {
      const row = await tx.fiscalGroup.upsert({
        where: { id: group.id },
        create: {
          id: group.id,
          organizationId: group.organizationId,
          ...data,
          createdAt: group.createdAt,
        },
        update: data,
      });

      // Substitui o conjunto de alíquotas por UF (só ICMS as tem).
      await tx.fiscalGroupUfRate.deleteMany({
        where: { organizationId: group.organizationId, fiscalGroupId: row.id },
      });
      if (group.ufRates.length > 0) {
        await tx.fiscalGroupUfRate.createMany({
          data: group.ufRates.map((rate) => ({
            organizationId: group.organizationId,
            fiscalGroupId: row.id,
            uf: rate.uf,
            rateType: rate.rateType,
            aliquota: rate.aliquota,
            updatedAt: group.updatedAt,
          })),
        });
      }

      return tx.fiscalGroup.findFirstOrThrow({
        where: { id: row.id },
        include: { ufRates: true },
      });
    });

    return this.toEntity(saved);
  }

  async countProductsByGroup(
    organizationId: string,
    taxType: FiscalTaxType,
  ): Promise<Record<string, number>> {
    const field = TAX_TYPE_FK[taxType];
    // Um único `groupBy` para todos os grupos do tributo — nada de N+1 por
    // grupo na listagem unificada (spec erp/022, D2).
    const rows = await this.prisma.scoped.productFiscal.groupBy({
      by: [field],
      where: { organizationId, [field]: { not: null } },
      _count: { _all: true },
    });
    const counts: Record<string, number> = {};
    for (const row of rows) {
      // `field` é o literal usado no `by`/`where` acima — `row[field]` já é o
      // grupo correspondente na linha do groupBy, sem cast (achado do
      // typescript-reviewer: o cast anterior via `Record<string, unknown>`
      // descartava a garantia estrutural do retorno tipado do Prisma).
      const groupId = row[field];
      if (groupId) counts[groupId] = row._count._all;
    }
    return counts;
  }

  async deleteById(organizationId: string, id: string): Promise<void> {
    // `fiscalGroupUfRate` tem FK sem cascade explícito no schema Prisma deste
    // model — apaga o filho primeiro pra não deixar linha órfã / violar FK.
    await this.prisma.scoped.$transaction([
      this.prisma.scoped.fiscalGroupUfRate.deleteMany({
        where: { organizationId, fiscalGroupId: id },
      }),
      this.prisma.scoped.fiscalGroup.deleteMany({
        where: { organizationId, id },
      }),
    ]);
  }

  async listProductsUsingGroup(
    organizationId: string,
    groupId: string,
  ): Promise<FiscalGroupProductRef[]> {
    // Um groupId só casa com a FK do seu próprio tributo (pisCofins ou icms).
    const rows = await this.prisma.scoped.productFiscal.findMany({
      where: {
        organizationId,
        OR: [
          { pisCofinsGroupId: groupId },
          { icmsGroupId: groupId },
          { issqnGroupId: groupId },
          { ipiGroupId: groupId },
        ],
      },
      select: {
        productId: true,
        product: { select: { name: true, sku: true } },
      },
      orderBy: { product: { name: 'asc' } },
    });
    return rows.map((row) => ({
      productId: row.productId,
      name: row.product?.name ?? '',
      sku: row.product?.sku ?? '',
    }));
  }

  private toEntity(row: Row): FiscalGroup {
    const ufRates: FiscalGroupUfRate[] = (row.ufRates ?? []).map((rate) => ({
      uf: rate.uf,
      rateType: rate.rateType as UfRateType,
      aliquota: toNumber(rate.aliquota),
    }));
    const props: FiscalGroupProps = {
      organizationId: row.organizationId,
      // Cast estreitado por FiscalGroup.validate() no construtor (lança se inválido).
      taxType: row.taxType as FiscalTaxType,
      name: row.name,
      pisCst: row.pisCst,
      pisAliquota: toNullableNumber(row.pisAliquota),
      cofinsCst: row.cofinsCst,
      cofinsAliquota: toNullableNumber(row.cofinsAliquota),
      icmsCst: row.icmsCst,
      icmsCsosn: row.icmsCsosn,
      issqnServiceCode: row.issqnServiceCode,
      issqnNationalCode: row.issqnNationalCode,
      issqnRate: toNullableNumber(row.issqnRate),
      issqnTribType: row.issqnTribType,
      ipiCst: row.ipiCst,
      ipiEnquadramento: row.ipiEnquadramento,
      ipiRate: toNullableNumber(row.ipiRate),
      ufRates,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return FiscalGroup.with(props, row.id);
  }
}
