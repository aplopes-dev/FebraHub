import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import {
  CommissionPaymentTrigger,
  CommissionType,
} from '../../../../../../generated/prisma/client';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import { CommissionRule } from '../../domain/entities/commission-rule.entity';
import { CommissionRuleRepository } from '../../domain/repositories/commission-rule.repository.interface';

type RuleTreatmentRow = {
  treatmentId: string;
  amountCents: number;
  treatmentValueCents: number;
};

type RuleRow = {
  id: string;
  storeId: string;
  memberId: string;
  memberName: string;
  paymentTrigger: CommissionPaymentTrigger;
  commissionType: CommissionType;
  percentageValue: number | null;
  commissionValueCents: number | null;
  allowValueExceedsTreatment: boolean;
  planId: string | null;
  specialtyId: string | null;
  createdAt: Date;
  updatedAt: Date;
  treatments: RuleTreatmentRow[];
};

@Injectable()
export class PrismaCommissionRuleRepository extends CommissionRuleRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByMember(
    storeId: string,
    memberId: string,
  ): Promise<CommissionRule[]> {
    const rows = await this.prisma.commissionRule.findMany({
      where: { storeId, memberId },
      include: { treatments: true },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async replaceAll(
    storeId: string,
    memberId: string,
    memberName: string,
    rules: CommissionRule[],
  ): Promise<CommissionRule[]> {
    await this.prisma.$transaction(async (tx) => {
      await tx.commissionRule.deleteMany({ where: { storeId, memberId } });

      for (const rule of rules) {
        await tx.commissionRule.create({
          data: {
            id: rule.id,
            storeId,
            memberId,
            memberName,
            paymentTrigger: rule.paymentTrigger as CommissionPaymentTrigger,
            commissionType: rule.commissionType as CommissionType,
            percentageValue: rule.percentageValue,
            commissionValueCents: rule.commissionValueCents,
            allowValueExceedsTreatment: rule.allowValueExceedsTreatment,
            planId: rule.planId,
            specialtyId: rule.specialtyId,
            createdAt: rule.createdAt,
            updatedAt: rule.updatedAt,
            treatments:
              rule.treatments.length > 0
                ? {
                    create: rule.treatments.map((treatment) => ({
                      id: randomUUID(),
                      treatmentId: treatment.treatmentId,
                      amountCents: treatment.amountCents,
                      treatmentValueCents: treatment.treatmentValueCents,
                    })),
                  }
                : undefined,
          },
        });
      }
    });

    return this.findByMember(storeId, memberId);
  }

  async existsByMember(storeId: string, memberId: string): Promise<boolean> {
    const count = await this.prisma.commissionRule.count({
      where: { storeId, memberId },
    });
    return count > 0;
  }

  async listConfiguredMembers(
    storeId: string,
    search?: string,
  ): Promise<{ memberId: string; memberName: string }[]> {
    const rows = await this.prisma.commissionRule.findMany({
      where: {
        storeId,
        ...(search?.trim()
          ? {
              memberName: {
                contains: search.trim(),
                mode: 'insensitive' as const,
              },
            }
          : {}),
      },
      select: { memberId: true, memberName: true },
      distinct: ['memberId'],
      orderBy: { memberName: 'asc' },
    });
    return rows.map((row) => ({
      memberId: row.memberId,
      memberName: row.memberName,
    }));
  }

  private toEntity(row: RuleRow): CommissionRule {
    return CommissionRule.with(
      {
        storeId: row.storeId,
        memberId: row.memberId,
        memberName: row.memberName,
        paymentTrigger: row.paymentTrigger,
        commissionType: row.commissionType,
        percentageValue: row.percentageValue,
        commissionValueCents: row.commissionValueCents,
        allowValueExceedsTreatment: row.allowValueExceedsTreatment,
        planId: row.planId,
        specialtyId: row.specialtyId,
        treatments: row.treatments.map((treatment) => ({
          treatmentId: treatment.treatmentId,
          amountCents: treatment.amountCents,
          treatmentValueCents: treatment.treatmentValueCents,
        })),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }
}
