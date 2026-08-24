import { Inject, Injectable } from '@nestjs/common';
import type { SplitStatus } from '../../generated/prisma/enums.js';
import { decimalToNumber } from '../../common/utils/serialization.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  resolveSplitAmounts,
  validateSplitRules,
  type SplitRuleInput,
} from './split-rules.util.js';

@Injectable()
export class SplitsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  validateAndResolve(chargeAmount: number, rules: SplitRuleInput[]) {
    validateSplitRules(chargeAmount, rules);
    return resolveSplitAmounts(chargeAmount, rules);
  }

  async createForCharge(input: {
    tenantId: string;
    chargeId: string;
    chargeAmount: number;
    rules: SplitRuleInput[];
  }) {
    if (!input.rules.length) return [];

    const resolved = this.validateAndResolve(input.chargeAmount, input.rules);
    const rows = await this.prisma.db.$transaction(async (tx) => {
      const created = [];
      for (const rule of resolved) {
        created.push(
          await tx.split.create({
            data: {
              tenantId: input.tenantId,
              chargeId: input.chargeId,
              recipientId: rule.recipientId,
              type: rule.type,
              amount: rule.amount,
              percentage: rule.percentage,
              status: 'PENDING',
            },
          }),
        );
      }
      return created;
    });
    return rows.map((row) => this.toResponse(row));
  }

  async listByCharge(tenantId: string, chargeId: string) {
    const rows = await this.prisma.db.split.findMany({
      where: { tenantId, chargeId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => this.toResponse(row));
  }

  async markCompletedForCharge(chargeId: string) {
    const result = await this.prisma.db.split.updateMany({
      where: { chargeId, status: 'PENDING' },
      data: { status: 'COMPLETED' },
    });
    return result.count;
  }

  async listByRecipient(tenantId: string, recipientId: string, status?: SplitStatus) {
    const rows = await this.prisma.db.split.findMany({
      where: {
        tenantId,
        recipientId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((row) => this.toResponse(row));
  }

  private toResponse(row: {
    id: string;
    chargeId: string;
    recipientId: string;
    type: string;
    amount: { toString(): string } | null;
    percentage: { toString(): string } | null;
    providerSplitId: string | null;
    status: string;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      chargeId: row.chargeId,
      recipientId: row.recipientId,
      type: row.type,
      amount: row.amount ? decimalToNumber(row.amount) : null,
      percentage: row.percentage ? decimalToNumber(row.percentage) : null,
      providerSplitId: row.providerSplitId,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
