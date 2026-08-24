import { Injectable } from '@nestjs/common';
import { Budget } from '../../../patient-budgets/domain/entities/budget.entity';
import type { BudgetItem } from '../../../patient-budgets/domain/entities/budget-item.entity';
import {
  calculateInstallmentBalanceCents,
  distributeInstallmentAmounts,
} from '../../../patient-budgets/application/utils/budget-pricing.utils';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { PatientFinancialEntry } from '../../domain/entities/patient-financial-entry.entity';
import { PatientFinancialEntryRepository } from '../../domain/repositories/patient-financial-entry.repository.interface';
import {
  addMonthsToDate,
  buildDebitDetailFromBudgetItem,
} from '../utils/patient-financial-entry.utils';

export type BudgetApproveInstallmentScheduleItem = {
  dueDate: Date;
  valueCents: number;
};

export type GenerateBudgetFinancialEntriesInput = {
  storeId: string;
  patientId: string;
  budget: Budget;
  items: BudgetItem[];
  /** Vencimento base dos lançamentos; default = `budget.date`. */
  dueDate?: Date;
  /** Parcelas customizadas (só orçamento parcelado). */
  installments?: BudgetApproveInstallmentScheduleItem[];
};

/** Rateia `totalCents` proporcionalmente aos pesos; o último absorve o resto. */
export function allocateCentsByWeight(
  weights: number[],
  totalCents: number,
): number[] {
  if (weights.length === 0) {
    return [];
  }

  const safeTotal = Math.max(0, totalCents);
  const weightSum = weights.reduce((sum, weight) => sum + Math.max(0, weight), 0);

  if (weightSum <= 0) {
    const base = Math.floor(safeTotal / weights.length);
    const amounts = weights.map(() => base);
    amounts[amounts.length - 1] += safeTotal - base * weights.length;
    return amounts;
  }

  const amounts = weights.map((weight) =>
    Math.floor((safeTotal * Math.max(0, weight)) / weightSum),
  );
  const allocated = amounts.reduce((sum, value) => sum + value, 0);
  amounts[amounts.length - 1] += safeTotal - allocated;
  return amounts;
}

@Injectable()
export class GenerateBudgetFinancialEntriesService {
  constructor(
    private readonly entryRepository: PatientFinancialEntryRepository,
  ) {}

  async execute(input: GenerateBudgetFinancialEntriesInput): Promise<void> {
    const { storeId, patientId, budget, items, dueDate, installments } = input;

    const alreadyGenerated = await this.entryRepository.existsByBudgetId(
      storeId,
      budget.id,
    );
    if (alreadyGenerated) {
      return;
    }

    const entries = budget.installmentEnabled
      ? this.buildInstallmentEntries(
          storeId,
          patientId,
          budget,
          dueDate,
          installments,
        )
      : this.buildProcedureEntries(storeId, patientId, budget, items, dueDate);

    if (entries.length === 0) {
      return;
    }

    await this.entryRepository.saveMany(entries);
  }

  /** Sem parcelamento: 1 linha por procedimento, nome do tratamento (sem i/n). */
  private buildProcedureEntries(
    storeId: string,
    patientId: string,
    budget: Budget,
    items: BudgetItem[],
    dueDate?: Date,
  ): PatientFinancialEntry[] {
    if (items.length === 0) {
      return [];
    }

    const sortedItems = [...items].sort(
      (left, right) => left.sortOrder - right.sortOrder,
    );
    const baseDate = dueDate ?? budget.date;
    const itemWeights = sortedItems.map((item) => item.valueCents);
    const itemSum = itemWeights.reduce((sum, value) => sum + value, 0);
    const values =
      itemSum === budget.finalValueCents
        ? itemWeights
        : allocateCentsByWeight(itemWeights, budget.finalValueCents);

    return sortedItems.map((item, index) => {
      const valueCents = values[index] ?? item.valueCents;
      return PatientFinancialEntry.create({
        storeId,
        patientId,
        date: baseDate,
        name: item.treatmentName,
        valueCents,
        source: 'budget_approve',
        budgetId: budget.id,
        budgetItemId: item.id,
        installmentIndex: index + 1,
        debitDetail: buildDebitDetailFromBudgetItem(item, valueCents),
      });
    });
  }

  /** Com parcelamento: Entrada (opcional) + k/N — descrição do orçamento. */
  private buildInstallmentEntries(
    storeId: string,
    patientId: string,
    budget: Budget,
    dueDate?: Date,
    customInstallments?: BudgetApproveInstallmentScheduleItem[],
  ): PatientFinancialEntry[] {
    const description = budget.description.trim() || 'Orçamento';
    const baseDate = dueDate ?? budget.date;
    const entries: PatientFinancialEntry[] = [];

    if (budget.downPaymentCents > 0) {
      entries.push(
        PatientFinancialEntry.create({
          storeId,
          patientId,
          date: baseDate,
          name: `Entrada — ${description}`,
          valueCents: budget.downPaymentCents,
          source: 'budget_approve',
          budgetId: budget.id,
          installmentIndex: 0,
        }),
      );
    }

    const balanceCents = calculateInstallmentBalanceCents(
      budget.finalValueCents,
      budget.downPaymentCents,
    );

    if (customInstallments && customInstallments.length > 0) {
      const scheduleSum = customInstallments.reduce(
        (sum, row) => sum + Math.max(0, row.valueCents),
        0,
      );
      if (scheduleSum !== balanceCents) {
        throw new ValidatorDomainError({
          internalMessage: `Installment schedule sum ${scheduleSum} !== balance ${balanceCents}`,
          externalMessage:
            'A soma das parcelas deve ser igual ao saldo do orçamento (total − entrada).',
          context: GenerateBudgetFinancialEntriesService.name,
        });
      }

      const totalInstallments = customInstallments.length;
      customInstallments.forEach((row, index) => {
        const installmentNumber = index + 1;
        entries.push(
          PatientFinancialEntry.create({
            storeId,
            patientId,
            date: row.dueDate,
            name: `${installmentNumber}/${totalInstallments} — ${description}`,
            valueCents: row.valueCents,
            source: 'budget_approve',
            budgetId: budget.id,
            installmentIndex: installmentNumber,
          }),
        );
      });

      return entries;
    }

    const totalInstallments = budget.installmentsCount;
    const installmentAmounts = distributeInstallmentAmounts(
      balanceCents,
      totalInstallments,
    );

    installmentAmounts.forEach((valueCents, index) => {
      const installmentNumber = index + 1;
      entries.push(
        PatientFinancialEntry.create({
          storeId,
          patientId,
          date: addMonthsToDate(baseDate, installmentNumber),
          name: `${installmentNumber}/${totalInstallments} — ${description}`,
          valueCents,
          source: 'budget_approve',
          budgetId: budget.id,
          installmentIndex: installmentNumber,
        }),
      );
    });

    return entries;
  }
}
