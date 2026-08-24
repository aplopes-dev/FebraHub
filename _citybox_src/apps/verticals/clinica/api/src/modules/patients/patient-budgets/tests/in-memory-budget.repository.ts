import { BudgetRepository } from '../domain/repositories/budget.repository.interface';
import type {
  ApprovedBudgetInRangeCriteria,
  ApprovedBudgetWithItems,
  BudgetAnalysisInRangeCriteria,
  BudgetAnalysisMeta,
  BudgetDetail,
  BudgetListCriteria,
  BudgetListItem,
  BudgetStatusUpdateMeta,
  OpenRejectedBudgetListCriteria,
  OpenRejectedBudgetListResult,
} from '../domain/repositories/budget.repository.interface';
import { toIsoDateOnly } from '../../../financial/entries/application/utils/financial-entry.utils';
import {
  Budget,
  type BudgetProps,
  type BudgetStatus,
} from '../domain/entities/budget.entity';
import {
  BudgetItem,
  type BudgetItemProps,
  type BudgetItemLocationType,
} from '../domain/entities/budget-item.entity';

function normalizeSearchTerm(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function matchesBudgetSearch(budget: Budget, search?: string): boolean {
  const query = search?.trim();
  if (!query) return true;

  const normalizedQuery = normalizeSearchTerm(query);
  return (
    normalizeSearchTerm(budget.description).includes(normalizedQuery) ||
    normalizeSearchTerm(budget.responsibleName).includes(normalizedQuery)
  );
}

function compareBudgets(
  left: Budget,
  right: Budget,
  sortBy: BudgetListCriteria['sortBy'],
  sortOrder: NonNullable<BudgetListCriteria['sortOrder']>,
): number {
  let result = 0;

  switch (sortBy) {
    case 'description':
      result = left.description.localeCompare(right.description, 'pt-BR');
      break;
    case 'finalValueCents':
      result = left.finalValueCents - right.finalValueCents;
      break;
    case 'status':
      result = left.status.localeCompare(right.status, 'pt-BR');
      break;
    case 'date':
    default:
      result = left.date.getTime() - right.date.getTime();
      break;
  }

  return sortOrder === 'desc' ? -result : result;
}

export class InMemoryBudgetRepository extends BudgetRepository {
  private readonly budgets = new Map<string, Budget>();
  private readonly items = new Map<string, BudgetItem>();
  private readonly patientNames = new Map<string, string>();

  seedPatientName(patientId: string, name: string): void {
    this.patientNames.set(patientId, name);
  }

  async findById(
    storeId: string,
    patientId: string,
    budgetId: string,
  ): Promise<BudgetDetail | null> {
    const budget = this.budgets.get(budgetId);
    if (
      !budget ||
      budget.storeId !== storeId ||
      budget.patientId !== patientId
    ) {
      return null;
    }
    return this.toDetail(budget);
  }

  async findManyByPatientId(
    storeId: string,
    patientId: string,
    criteria: BudgetListCriteria,
  ): Promise<BudgetListItem[]> {
    const sortOrder = criteria.sortOrder ?? (criteria.sortBy ? 'asc' : 'desc');
    const filtered = [...this.budgets.values()]
      .filter(
        (budget) =>
          budget.storeId === storeId && budget.patientId === patientId,
      )
      .filter((budget) => matchesBudgetSearch(budget, criteria.search))
      .sort((left, right) =>
        compareBudgets(left, right, criteria.sortBy, sortOrder),
      );

    return filtered
      .slice(criteria.skip, criteria.skip + criteria.take)
      .map((budget) => this.toListItem(budget));
  }

  async countByPatientId(
    storeId: string,
    patientId: string,
    criteria: Omit<BudgetListCriteria, 'skip' | 'take'>,
  ): Promise<number> {
    return [...this.budgets.values()].filter(
      (budget) =>
        budget.storeId === storeId &&
        budget.patientId === patientId &&
        matchesBudgetSearch(budget, criteria.search),
    ).length;
  }

  async save(detail: BudgetDetail): Promise<BudgetDetail> {
    this.budgets.set(detail.budget.id, detail.budget);

    for (const [id, item] of [...this.items.entries()]) {
      if (item.budgetId === detail.budget.id) {
        this.items.delete(id);
      }
    }

    for (const item of detail.items) {
      this.items.set(item.id, item);
    }

    return this.toDetail(detail.budget);
  }

  async delete(
    storeId: string,
    patientId: string,
    budgetId: string,
  ): Promise<void> {
    const budget = this.budgets.get(budgetId);
    if (
      !budget ||
      budget.storeId !== storeId ||
      budget.patientId !== patientId
    ) {
      return;
    }

    this.budgets.delete(budgetId);
    for (const [id, item] of [...this.items.entries()]) {
      if (item.budgetId === budgetId) {
        this.items.delete(id);
      }
    }
  }

  async updateStatus(
    storeId: string,
    patientId: string,
    budgetId: string,
    status: BudgetStatus,
    meta?: BudgetStatusUpdateMeta,
  ): Promise<BudgetDetail | null> {
    const detail = await this.findById(storeId, patientId, budgetId);
    if (!detail) return null;

    detail.budget.changeStatus(status, meta);
    this.budgets.set(detail.budget.id, detail.budget);
    return this.toDetail(detail.budget);
  }

  async sumOpenRejectedBudgetsCents(storeId: string): Promise<number> {
    return [...this.budgets.values()]
      .filter(
        (budget) =>
          budget.storeId === storeId &&
          (budget.status === 'pending' || budget.status === 'rejected'),
      )
      .reduce((sum, budget) => sum + budget.finalValueCents, 0);
  }

  async listOpenRejectedBudgets(
    storeId: string,
    criteria: OpenRejectedBudgetListCriteria,
  ): Promise<OpenRejectedBudgetListResult> {
    const filtered = [...this.budgets.values()]
      .filter(
        (budget) =>
          budget.storeId === storeId &&
          (budget.status === 'pending' || budget.status === 'rejected'),
      )
      .sort((left, right) => right.date.getTime() - left.date.getTime());

    return {
      items: filtered
        .slice(criteria.skip, criteria.skip + criteria.take)
        .map((budget) => ({
          id: budget.id,
          date: budget.date,
          patientId: budget.patientId,
          patientName:
            this.patientNames.get(budget.patientId) ?? 'Paciente',
          description: budget.description,
          status: budget.status as 'pending' | 'rejected',
          finalValueCents: budget.finalValueCents,
        })),
      total: filtered.length,
      totalValueCents: filtered.reduce(
        (sum, budget) => sum + budget.finalValueCents,
        0,
      ),
    };
  }

  async listApprovedBudgetsInRange(
    storeId: string,
    criteria: ApprovedBudgetInRangeCriteria,
  ): Promise<ApprovedBudgetWithItems[]> {
    return [...this.budgets.values()]
      .filter((budget) => {
        if (budget.storeId !== storeId || budget.status !== 'approved') {
          return false;
        }
        const saleDate = toIsoDateOnly(budget.approvedAt ?? budget.date);
        return (
          saleDate >= criteria.startIsoDate && saleDate <= criteria.endIsoDate
        );
      })
      .map((budget) => ({
        budget,
        items: [...this.items.values()]
          .filter((item) => item.budgetId === budget.id)
          .sort((a, b) => a.sortOrder - b.sortOrder),
        patientName: this.patientNames.get(budget.patientId) ?? 'Paciente',
      }));
  }

  async findManyDetailsByIds(
    storeId: string,
    budgetIds: string[],
  ): Promise<ApprovedBudgetWithItems[]> {
    const idSet = new Set(budgetIds);
    return [...this.budgets.values()]
      .filter((budget) => budget.storeId === storeId && idSet.has(budget.id))
      .map((budget) => ({
        budget,
        items: [...this.items.values()]
          .filter((item) => item.budgetId === budget.id)
          .sort((a, b) => a.sortOrder - b.sortOrder),
        patientName: this.patientNames.get(budget.patientId) ?? 'Paciente',
      }));
  }

  async listBudgetsForAnalysisInRange(
    storeId: string,
    criteria: BudgetAnalysisInRangeCriteria,
  ): Promise<ApprovedBudgetWithItems[]> {
    const statuses = new Set(
      criteria.statuses ?? ['pending', 'approved', 'rejected'],
    );
    return [...this.budgets.values()]
      .filter((budget) => {
        if (budget.storeId !== storeId) return false;
        if (!statuses.has(budget.status)) return false;
        if (
          criteria.responsibleId &&
          budget.responsibleId !== criteria.responsibleId
        ) {
          return false;
        }
        const dateKey = toIsoDateOnly(budget.date);
        return (
          dateKey >= criteria.startIsoDate && dateKey <= criteria.endIsoDate
        );
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .map((budget) => ({
        budget,
        items: [...this.items.values()]
          .filter((item) => item.budgetId === budget.id)
          .sort((left, right) => left.sortOrder - right.sortOrder),
        patientName: this.patientNames.get(budget.patientId) ?? 'Paciente',
      }));
  }

  async listBudgetAnalysisMeta(storeId: string): Promise<BudgetAnalysisMeta> {
    const professionals = new Map<string, string>();
    const years = new Set<number>();
    for (const budget of this.budgets.values()) {
      if (budget.storeId !== storeId) continue;
      if (budget.status === 'expired') continue;
      professionals.set(budget.responsibleId, budget.responsibleName);
      years.add(Number(toIsoDateOnly(budget.date).slice(0, 4)));
    }
    return {
      professionals: [...professionals.entries()]
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
      years: [...years].sort((a, b) => b - a),
    };
  }

  seed(detail: BudgetDetail): void {
    this.budgets.set(detail.budget.id, detail.budget);
    for (const item of detail.items) {
      this.items.set(item.id, item);
    }
  }

  private toListItem(budget: Budget): BudgetListItem {
    const itemsCount = [...this.items.values()].filter(
      (item) => item.budgetId === budget.id,
    ).length;
    return {
      budget,
      itemsCount,
      contractEmissionId: null,
      contractPatientSignatureStatus: null,
      contractResponsibleSignatureStatus: null,
      contractPatientName: null,
      contractResponsibleName: null,
      contractPatientSignedAt: null,
      contractResponsibleSignedAt: null,
    };
  }

  private toDetail(budget: Budget): BudgetDetail {
    const items = [...this.items.values()]
      .filter((item) => item.budgetId === budget.id)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return { budget, items };
  }
}

export function createBudgetFixture(
  overrides: Partial<BudgetProps> & Pick<BudgetProps, 'storeId' | 'patientId'>,
  id?: string,
): Budget {
  return Budget.create(
    {
      description: 'Orçamento teste',
      date: new Date('2026-07-01'),
      observations: '',
      responsibleId: 'prof-1',
      responsibleName: 'Dr. Teste',
      subtotalCents: 5000,
      finalValueCents: 5000,
      ...overrides,
    },
    id,
  );
}

export function createBudgetItemFixture(
  budgetId: string,
  storeId: string,
  overrides?: Partial<BudgetItemProps>,
  id?: string,
): BudgetItem {
  return BudgetItem.create(
    {
      storeId,
      budgetId,
      planId: overrides?.planId ?? 'plan-1',
      treatmentId: overrides?.treatmentId ?? 'treatment-1',
      professionalId: 'prof-1',
      professionalName: 'Dr. Teste',
      planName: 'Plano',
      treatmentName: 'Consulta',
      valueCents: 5000,
      locationType: overrides?.locationType ?? 'none',
      locationLabel: '',
      sortOrder: 0,
      ...overrides,
    },
    id,
  );
}
