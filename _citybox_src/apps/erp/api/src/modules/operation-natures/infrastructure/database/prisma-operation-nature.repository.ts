import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  OperationNature,
  type IcmsLivreCondition,
  type OperationNatureCfopRule,
  type OperationNatureGroupRule,
  type OperationNatureGroupTaxType,
  type OperationNatureProps,
} from '../../domain/entities/operation-nature.entity';
import { OperationNatureRepository } from '../../domain/repositories/operation-nature.repository.interface';

type CfopRuleRow = {
  fromCfop: string;
  toCfop: string;
  icmsLivre: string;
};

type GroupRuleRow = {
  taxType: string;
  fromGroupId: string | null;
  toGroupId: string | null;
};

type Row = {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  keepBenefitInUf: boolean;
  createdAt: Date;
  updatedAt: Date;
  cfopRules?: CfopRuleRow[];
  groupRules?: GroupRuleRow[];
};

@Injectable()
export class PrismaOperationNatureRepository extends OperationNatureRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async listByOrganization(organizationId: string): Promise<OperationNature[]> {
    const rows = await this.prisma.scoped.operationNature.findMany({
      where: { organizationId },
      include: { cfopRules: true, groupRules: true },
      orderBy: { name: 'asc' },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<OperationNature | null> {
    const row = await this.prisma.scoped.operationNature.findFirst({
      where: { id, organizationId },
      include: { cfopRules: true, groupRules: true },
    });
    return row ? this.toEntity(row) : null;
  }

  async save(nature: OperationNature): Promise<OperationNature> {
    const base = {
      name: nature.name,
      description: nature.description,
      keepBenefitInUf: nature.keepBenefitInUf,
      updatedAt: nature.updatedAt,
    };

    const saved = await this.prisma.scoped.$transaction(async (tx) => {
      const row = await tx.operationNature.upsert({
        where: { id: nature.id },
        create: {
          id: nature.id,
          organizationId: nature.organizationId,
          ...base,
          createdAt: nature.createdAt,
        },
        update: base,
      });

      // Substitui o conjunto de regras (filhas) — molde de FiscalGroupUfRate.
      await tx.operationNatureCfopRule.deleteMany({
        where: {
          organizationId: nature.organizationId,
          operationNatureId: row.id,
        },
      });
      await tx.operationNatureGroupRule.deleteMany({
        where: {
          organizationId: nature.organizationId,
          operationNatureId: row.id,
        },
      });
      if (nature.cfopRules.length > 0) {
        await tx.operationNatureCfopRule.createMany({
          data: nature.cfopRules.map((rule) => ({
            organizationId: nature.organizationId,
            operationNatureId: row.id,
            fromCfop: rule.fromCfop,
            toCfop: rule.toCfop,
            icmsLivre: rule.icmsLivre,
            updatedAt: nature.updatedAt,
          })),
        });
      }
      if (nature.groupRules.length > 0) {
        await tx.operationNatureGroupRule.createMany({
          data: nature.groupRules.map((rule) => ({
            organizationId: nature.organizationId,
            operationNatureId: row.id,
            taxType: rule.taxType,
            fromGroupId: rule.fromGroupId,
            toGroupId: rule.toGroupId,
            updatedAt: nature.updatedAt,
          })),
        });
      }

      return tx.operationNature.findFirstOrThrow({
        where: { id: row.id },
        include: { cfopRules: true, groupRules: true },
      });
    });

    return this.toEntity(saved);
  }

  /// Filhas (`OperationNatureCfopRule`/`OperationNatureGroupRule`) têm
  /// `onDelete: Cascade` no schema — o Postgres remove elas sozinho, sem
  /// precisar de transação com `deleteMany` explícito (diferente de
  /// `FiscalGroup`, que tem uma FK sem cascade). `deleteMany` em vez de
  /// `delete`: filtra por `{ id, organizationId }` sem precisar do nome da
  /// chave composta, e não lança se o registro já não existir (idempotente —
  /// o use case já verificou existência antes, então isso só é relevante numa
  /// corrida entre duas exclusões concorrentes).
  async deleteById(organizationId: string, id: string): Promise<void> {
    await this.prisma.scoped.operationNature.deleteMany({
      where: { organizationId, id },
    });
  }

  private toEntity(row: Row): OperationNature {
    const cfopRules: OperationNatureCfopRule[] = (row.cfopRules ?? []).map(
      (rule) => ({
        fromCfop: rule.fromCfop,
        toCfop: rule.toCfop,
        // Estreitado pelo CHECK do banco + validação da entidade no construtor.
        icmsLivre: rule.icmsLivre as IcmsLivreCondition,
      }),
    );
    // Regra de grupo **órfã** (grupo excluído → FK SetNull) é descartada: o
    // resolvedor não deve ver from/to nulos, e a entidade exige strings.
    const groupRules: OperationNatureGroupRule[] = (row.groupRules ?? [])
      .filter((rule) => rule.fromGroupId !== null && rule.toGroupId !== null)
      .map((rule) => ({
        taxType: rule.taxType as OperationNatureGroupTaxType,
        fromGroupId: rule.fromGroupId as string,
        toGroupId: rule.toGroupId as string,
      }));

    const props: OperationNatureProps = {
      organizationId: row.organizationId,
      name: row.name,
      description: row.description,
      keepBenefitInUf: row.keepBenefitInUf,
      cfopRules,
      groupRules,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return OperationNature.with(props, row.id);
  }
}
