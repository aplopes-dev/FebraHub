import { PatientFinancialEntry } from '../domain/entities/patient-financial-entry.entity';
import { PatientFinancialEntryRepository } from '../domain/repositories/patient-financial-entry.repository.interface';
import type {
  PatientFinancialEntryListCriteria,
  PatientFinancialEntryTotals,
  PatientFinancialEntryTotalsCriteria,
} from '../domain/repositories/patient-financial-entry.repository.interface';

function matchesPeriod(
  date: Date,
  periodFrom?: string,
  periodTo?: string,
): boolean {
  const iso = date.toISOString().slice(0, 10);
  if (periodFrom && iso < periodFrom) return false;
  if (periodTo && iso > periodTo) return false;
  return true;
}

function matchesListCriteria(
  entry: PatientFinancialEntry,
  criteria: Omit<PatientFinancialEntryListCriteria, 'skip' | 'take'>,
): boolean {
  const search = criteria.search?.trim().toLowerCase();
  if (search && !entry.name.toLowerCase().includes(search)) {
    return false;
  }
  if (criteria.status && entry.status !== criteria.status) {
    return false;
  }
  if (criteria.budgetItemId && entry.budgetItemId !== criteria.budgetItemId) {
    return false;
  }
  if (!matchesPeriod(entry.date, criteria.periodFrom, criteria.periodTo)) {
    return false;
  }
  return true;
}

function sortEntries(
  entries: PatientFinancialEntry[],
  criteria: Pick<PatientFinancialEntryListCriteria, 'sortBy' | 'sortOrder'>,
): PatientFinancialEntry[] {
  const sortOrder = criteria.sortOrder ?? 'desc';
  const direction = sortOrder === 'asc' ? 1 : -1;

  return [...entries].sort((left, right) => {
    switch (criteria.sortBy) {
      case 'name':
        return left.name.localeCompare(right.name) * direction;
      case 'valueCents':
        return (left.valueCents - right.valueCents) * direction;
      case 'status':
        return left.status.localeCompare(right.status) * direction;
      case 'date':
      default:
        return (left.date.getTime() - right.date.getTime()) * direction;
    }
  });
}

export class InMemoryPatientFinancialEntryRepository extends PatientFinancialEntryRepository {
  private entries: PatientFinancialEntry[] = [];

  seed(entries: PatientFinancialEntry[]): void {
    this.entries = [...entries];
  }

  async findById(
    storeId: string,
    patientId: string,
    entryId: string,
  ): Promise<PatientFinancialEntry | null> {
    return (
      this.entries.find(
        (entry) =>
          entry.id === entryId &&
          entry.storeId === storeId &&
          entry.patientId === patientId,
      ) ?? null
    );
  }

  async findManyByPatientId(
    storeId: string,
    patientId: string,
    criteria: PatientFinancialEntryListCriteria,
  ): Promise<PatientFinancialEntry[]> {
    const filtered = this.entries.filter(
      (entry) =>
        entry.storeId === storeId &&
        entry.patientId === patientId &&
        matchesListCriteria(entry, criteria),
    );

    return sortEntries(filtered, criteria).slice(
      criteria.skip,
      criteria.skip + criteria.take,
    );
  }

  async countByPatientId(
    storeId: string,
    patientId: string,
    criteria: Omit<PatientFinancialEntryListCriteria, 'skip' | 'take'>,
  ): Promise<number> {
    return this.entries.filter(
      (entry) =>
        entry.storeId === storeId &&
        entry.patientId === patientId &&
        matchesListCriteria(entry, criteria),
    ).length;
  }

  async sumTotalsByPatientId(
    storeId: string,
    patientId: string,
    criteria: PatientFinancialEntryTotalsCriteria,
  ): Promise<PatientFinancialEntryTotals> {
    return this.entries
      .filter(
        (entry) =>
          entry.storeId === storeId &&
          entry.patientId === patientId &&
          matchesPeriod(entry.date, criteria.periodFrom, criteria.periodTo),
      )
      .reduce<PatientFinancialEntryTotals>(
        (totals, entry) => {
          if (entry.status === 'received') {
            return {
              ...totals,
              receivedCents: totals.receivedCents + entry.valueCents,
            };
          }
          return {
            ...totals,
            pendingCents: totals.pendingCents + entry.valueCents,
          };
        },
        { receivedCents: 0, pendingCents: 0 },
      );
  }

  async existsByBudgetId(storeId: string, budgetId: string): Promise<boolean> {
    return this.entries.some(
      (entry) => entry.storeId === storeId && entry.budgetId === budgetId,
    );
  }

  async save(entry: PatientFinancialEntry): Promise<PatientFinancialEntry> {
    const index = this.entries.findIndex((item) => item.id === entry.id);
    if (index === -1) {
      this.entries = [entry, ...this.entries];
    } else {
      this.entries = this.entries.map((item) =>
        item.id === entry.id ? entry : item,
      );
    }
    return entry;
  }

  async saveMany(
    entries: PatientFinancialEntry[],
  ): Promise<PatientFinancialEntry[]> {
    for (const entry of entries) {
      await this.save(entry);
    }
    return entries;
  }

  async delete(
    storeId: string,
    patientId: string,
    entryId: string,
  ): Promise<void> {
    this.entries = this.entries.filter(
      (entry) =>
        !(
          entry.id === entryId &&
          entry.storeId === storeId &&
          entry.patientId === patientId
        ),
    );
  }
}
