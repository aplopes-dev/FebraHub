import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import { PatientFinancialEntry } from '../../domain/entities/patient-financial-entry.entity';
import { buildDebitDetailFromBudgetItem } from '../utils/patient-financial-entry.utils';

type BudgetItemHydrationRow = {
  id: string;
  planId: string;
  treatmentId: string;
  treatmentName: string;
  professionalId: string;
  locationType: 'tooth' | 'body_region' | 'session' | 'none';
  locationLabel: string;
};

/**
 * Preenche `debitDetail` em memória para lançamentos `budget_approve` legados
 * (gerados antes do snapshot na approve), a partir do `BudgetItem` vinculado.
 */
@Injectable()
export class HydratePatientFinancialDebitDetailService {
  constructor(private readonly prisma: PrismaService) {}

  async hydrateMany(
    entries: PatientFinancialEntry[],
  ): Promise<PatientFinancialEntry[]> {
    const missingItemIds = [
      ...new Set(
        entries
          .filter((entry) => !entry.debitDetail && entry.budgetItemId)
          .map((entry) => entry.budgetItemId as string),
      ),
    ];

    if (missingItemIds.length === 0) {
      return entries;
    }

    const rows = (await this.prisma.budgetItem.findMany({
      where: { id: { in: missingItemIds } },
      select: {
        id: true,
        planId: true,
        treatmentId: true,
        treatmentName: true,
        professionalId: true,
        locationType: true,
        locationLabel: true,
      },
    })) as BudgetItemHydrationRow[];

    const byId = new Map(rows.map((row) => [row.id, row]));

    return entries.map((entry) => {
      if (entry.debitDetail || !entry.budgetItemId) {
        return entry;
      }

      const item = byId.get(entry.budgetItemId);
      if (!item) {
        return entry;
      }

      return entry.withDebitDetail(
        buildDebitDetailFromBudgetItem(item, entry.valueCents),
      );
    });
  }

  async hydrateOne(
    entry: PatientFinancialEntry,
  ): Promise<PatientFinancialEntry> {
    const [hydrated] = await this.hydrateMany([entry]);
    return hydrated ?? entry;
  }
}
