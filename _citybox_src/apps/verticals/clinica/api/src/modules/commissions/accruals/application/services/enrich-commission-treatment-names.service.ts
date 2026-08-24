import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import { CommissionAccrual } from '../../domain/entities/commission-accrual.entity';
import { formatCommissionTreatmentName } from './debit-received-commission.math';

/**
 * Completa `treatmentName` com dente/região a partir do orçamento de origem
 * (útil para accruals gerados antes de gravar o rótulo no nome).
 * Não persiste — só enriquece a view.
 */
@Injectable()
export class EnrichCommissionTreatmentNamesService {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    storeId: string,
    accruals: CommissionAccrual[],
  ): Promise<CommissionAccrual[]> {
    if (accruals.length === 0) return accruals;

    const entryIds = [
      ...new Set(
        accruals
          .map((a) => a.sourceFinancialEntryId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    if (entryIds.length === 0) return accruals;

    const entries = await this.prisma.financialEntry.findMany({
      where: {
        storeId,
        id: { in: entryIds },
        budgetId: { not: null },
      },
      select: { id: true, budgetId: true },
    });
    if (entries.length === 0) return accruals;

    const entryBudget = new Map(
      entries.map((e) => [e.id, e.budgetId as string]),
    );
    const budgetIds = [...new Set([...entryBudget.values()])];

    const budgetItems = await this.prisma.budgetItem.findMany({
      where: { storeId, budgetId: { in: budgetIds } },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      select: {
        budgetId: true,
        professionalId: true,
        treatmentName: true,
        locationLabel: true,
      },
    });

    const result = [...accruals];

    for (const [entryId, budgetId] of entryBudget) {
      const entryAccruals = accruals
        .map((accrual, index) => ({ accrual, index }))
        .filter(({ accrual }) => accrual.sourceFinancialEntryId === entryId)
        .sort(
          (a, b) =>
            a.accrual.createdAt.getTime() - b.accrual.createdAt.getTime() ||
            a.accrual.id.localeCompare(b.accrual.id),
        );

      const items = budgetItems.filter((item) => item.budgetId === budgetId);

      const cursorByKey = new Map<string, number>();

      for (const { accrual, index } of entryAccruals) {
        const key = `${accrual.memberId}\0${accrual.treatmentName}`;
        const candidates = items.filter(
          (item) =>
            item.professionalId === accrual.memberId &&
            item.treatmentName === accrual.treatmentName &&
            item.locationLabel.trim().length > 0,
        );
        if (candidates.length === 0) continue;

        const cursor = cursorByKey.get(key) ?? 0;
        const item = candidates[cursor];
        cursorByKey.set(key, cursor + 1);
        if (!item) continue;

        const nextName = formatCommissionTreatmentName(
          item.treatmentName,
          item.locationLabel,
        );
        if (nextName === accrual.treatmentName) continue;

        result[index] = CommissionAccrual.with(
          {
            storeId: accrual.storeId,
            memberId: accrual.memberId,
            memberName: accrual.memberName,
            ruleId: accrual.ruleId,
            paymentTrigger: accrual.paymentTrigger,
            triggerLabel: accrual.triggerLabel,
            planName: accrual.planName,
            specialtyName: accrual.specialtyName,
            treatmentName: nextName,
            patientName: accrual.patientName,
            paidValueCents: accrual.paidValueCents,
            treatmentCostCents: accrual.treatmentCostCents,
            installment: accrual.installment,
            commissionCents: accrual.commissionCents,
            accruedAt: accrual.accruedAt,
            sourceFinancialEntryId: accrual.sourceFinancialEntryId,
            sourceBudgetId: accrual.sourceBudgetId,
            sourcePatientTreatmentId: accrual.sourcePatientTreatmentId,
            status: accrual.status,
            createdAt: accrual.createdAt,
            updatedAt: accrual.updatedAt,
          },
          accrual.id,
        );
      }
    }

    return result;
  }
}
