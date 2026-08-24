import { FinancialEntry } from '../domain/entities/financial-entry.entity';
import {
  FinancialEntryRepository,
  type CashflowDashboardListItem,
  type FinancialEntryByPaymentMethodCriteria,
  type FinancialEntryByPaymentMethodRow,
  type FinancialEntryListCriteria,
  type FinancialEntryLoaded,
  type FinancialEntryStats,
  type FinancialEntryStatsCriteria,
  type InadimplenciaDashboardDebtRow,
  type ExpenseByCategoryAggRow,
  type TicketMedioDayMetricRow,
} from '../domain/repositories/financial-entry.repository.interface';
import { toIsoDateOnly } from '../application/utils/financial-entry.utils';

function matchesPeriod(
  date: Date | null,
  startDate?: string,
  endDate?: string,
): boolean {
  if (!date) {
    return !startDate && !endDate;
  }
  const iso = toIsoDateOnly(date);
  if (startDate && iso < startDate) return false;
  if (endDate && iso > endDate) return false;
  return true;
}

function matchesCriteria(
  entry: FinancialEntry,
  criteria: Omit<FinancialEntryListCriteria, 'skip' | 'take'>,
): boolean {
  const dateField = criteria.dateField ?? 'dueDate';
  if (dateField === 'paidAt') {
    if (!matchesPeriod(entry.paidAt, criteria.startDate, criteria.endDate)) {
      return false;
    }
  } else if (
    !matchesPeriod(entry.dueDate, criteria.startDate, criteria.endDate)
  ) {
    return false;
  }

  if (
    (criteria.paidAtFrom || criteria.paidAtTo) &&
    !matchesPeriod(entry.paidAt, criteria.paidAtFrom, criteria.paidAtTo)
  ) {
    return false;
  }

  if (criteria.types?.length && !criteria.types.includes(entry.type)) {
    return false;
  }
  if (criteria.statuses?.length && !criteria.statuses.includes(entry.status)) {
    return false;
  }
  if (
    criteria.accountIds?.length &&
    (!entry.accountId || !criteria.accountIds.includes(entry.accountId))
  ) {
    return false;
  }
  if (
    criteria.paymentMethods?.length &&
    (!entry.paymentMethod ||
      !criteria.paymentMethods.includes(entry.paymentMethod))
  ) {
    return false;
  }
  if (criteria.categoryIds?.length) {
    const catIds = [entry.expenseCategoryId, entry.incomeCategoryId].filter(
      Boolean,
    ) as string[];
    if (!catIds.some((id) => criteria.categoryIds!.includes(id))) return false;
  }
  if (criteria.clientId && entry.clientId !== criteria.clientId) {
    return false;
  }
  const search = criteria.search?.trim().toLowerCase();
  if (search && !entry.description.toLowerCase().includes(search)) {
    return false;
  }
  return true;
}

function sortEntries(
  entries: FinancialEntry[],
  criteria: Pick<FinancialEntryListCriteria, 'sortBy' | 'sortOrder'>,
): FinancialEntry[] {
  const direction = (criteria.sortOrder ?? 'desc') === 'asc' ? 1 : -1;
  return [...entries].sort((left, right) => {
    switch (criteria.sortBy) {
      case 'description':
        return left.description.localeCompare(right.description) * direction;
      case 'valueCents':
        return (left.valueCents - right.valueCents) * direction;
      case 'status':
        return left.status.localeCompare(right.status) * direction;
      case 'dueDate':
      default:
        return (left.dueDate.getTime() - right.dueDate.getTime()) * direction;
    }
  });
}

function toLoaded(
  entry: FinancialEntry,
  clientNames?: Map<string, string>,
  clientPhones?: Map<string, string>,
): FinancialEntryLoaded {
  return {
    entry,
    account: entry.accountId ? { id: entry.accountId, name: 'Conta' } : null,
    expenseCategory: entry.expenseCategoryId
      ? { id: entry.expenseCategoryId, name: 'Despesa', color: '' }
      : null,
    incomeCategory: entry.incomeCategoryId
      ? { id: entry.incomeCategoryId, name: 'Receita', color: '' }
      : null,
    client: entry.clientId
      ? {
          id: entry.clientId,
          name: clientNames?.get(entry.clientId) ?? 'Cliente',
          phone: clientPhones?.get(entry.clientId) ?? null,
        }
      : null,
  };
}

export class InMemoryFinancialEntryRepository extends FinancialEntryRepository {
  private entries: FinancialEntry[] = [];
  private readonly clientNames = new Map<string, string>();
  private readonly clientPhones = new Map<string, string>();
  private readonly expenseCategories = new Map<
    string,
    { name: string; color: string }
  >();

  get items(): FinancialEntry[] {
    return this.entries;
  }

  seed(entries: FinancialEntry[]): void {
    this.entries = [...entries];
  }

  seedClientName(clientId: string, name: string): void {
    this.clientNames.set(clientId, name);
  }

  seedClientPhone(clientId: string, phone: string): void {
    this.clientPhones.set(clientId, phone);
  }

  seedExpenseCategory(categoryId: string, name: string, color: string): void {
    this.expenseCategories.set(categoryId, { name, color });
  }

  async findById(
    storeId: string,
    id: string,
  ): Promise<FinancialEntryLoaded | null> {
    const entry =
      this.entries.find((item) => item.id === id && item.storeId === storeId) ??
      null;
    return entry ? toLoaded(entry, this.clientNames, this.clientPhones) : null;
  }

  async findMany(
    storeId: string,
    criteria: FinancialEntryListCriteria,
  ): Promise<FinancialEntryLoaded[]> {
    const filtered = this.entries.filter(
      (entry) => entry.storeId === storeId && matchesCriteria(entry, criteria),
    );
    return sortEntries(filtered, criteria)
      .slice(criteria.skip, criteria.skip + criteria.take)
      .map((entry) => toLoaded(entry, this.clientNames, this.clientPhones));
  }

  async count(
    storeId: string,
    criteria: Omit<FinancialEntryListCriteria, 'skip' | 'take'>,
  ): Promise<number> {
    return this.entries.filter(
      (entry) => entry.storeId === storeId && matchesCriteria(entry, criteria),
    ).length;
  }

  async computeStats(
    storeId: string,
    criteria: FinancialEntryStatsCriteria,
  ): Promise<FinancialEntryStats> {
    let incomeReceived = 0;
    let incomeToReceive = 0;
    let expensePaid = 0;
    let expenseToPay = 0;

    for (const entry of this.entries) {
      if (entry.storeId !== storeId) continue;
      if (entry.status === 'cancelled') continue;
      if (!matchesPeriod(entry.dueDate, criteria.startDate, criteria.endDate)) {
        continue;
      }
      if (entry.type === 'income') {
        if (entry.status === 'received') incomeReceived += entry.valueCents;
        else if (entry.status === 'pending')
          incomeToReceive += entry.valueCents;
      } else if (entry.type === 'expense') {
        if (entry.status === 'paid') expensePaid += entry.valueCents;
        else if (entry.status === 'pending') expenseToPay += entry.valueCents;
      }
    }

    return {
      income: {
        received: incomeReceived,
        toReceive: incomeToReceive,
        total: incomeReceived + incomeToReceive,
      },
      expense: {
        paid: expensePaid,
        toPay: expenseToPay,
        total: expensePaid + expenseToPay,
      },
      balance: {
        current: incomeReceived - expensePaid,
        projected:
          incomeReceived + incomeToReceive - (expensePaid + expenseToPay),
      },
    };
  }

  async sumOverdueIncomeCents(
    storeId: string,
    todayIsoDate: string,
  ): Promise<number> {
    let total = 0;
    for (const entry of this.entries) {
      if (entry.storeId !== storeId) continue;
      if (entry.type !== 'income') continue;
      if (entry.status !== 'pending') continue;
      if (toIsoDateOnly(entry.dueDate) >= todayIsoDate) continue;
      total += entry.valueCents;
    }
    return total;
  }

  async aggregateByPaymentMethod(
    storeId: string,
    criteria: FinancialEntryByPaymentMethodCriteria,
  ): Promise<FinancialEntryByPaymentMethodRow[]> {
    const listCriteria: Omit<FinancialEntryListCriteria, 'skip' | 'take'> = {
      ...criteria,
      statuses: ['paid', 'received'],
    };

    const byMethod = new Map<
      string,
      { incomeCents: number; expenseCents: number }
    >();

    for (const entry of this.entries) {
      if (entry.storeId !== storeId) continue;
      if (!entry.paymentMethod) continue;
      if (!matchesCriteria(entry, listCriteria)) continue;

      const current = byMethod.get(entry.paymentMethod) ?? {
        incomeCents: 0,
        expenseCents: 0,
      };
      if (entry.type === 'income') {
        byMethod.set(entry.paymentMethod, {
          ...current,
          incomeCents: current.incomeCents + entry.valueCents,
        });
      } else if (entry.type === 'expense') {
        byMethod.set(entry.paymentMethod, {
          ...current,
          expenseCents: current.expenseCents + entry.valueCents,
        });
      }
    }

    return [...byMethod.entries()]
      .map(([paymentMethod, totals]) => ({
        paymentMethod,
        incomeCents: totals.incomeCents,
        expenseCents: totals.expenseCents,
        balanceCents: totals.incomeCents - totals.expenseCents,
      }))
      .sort((a, b) => a.paymentMethod.localeCompare(b.paymentMethod));
  }

  async save(entry: FinancialEntry): Promise<FinancialEntry> {
    const index = this.entries.findIndex((item) => item.id === entry.id);
    if (index === -1) {
      this.entries = [...this.entries, entry];
    } else {
      this.entries = this.entries.map((item) =>
        item.id === entry.id ? entry : item,
      );
    }
    return entry;
  }

  async saveMany(entries: FinancialEntry[]): Promise<FinancialEntry[]> {
    for (const entry of entries) {
      await this.save(entry);
    }
    return entries;
  }

  async delete(storeId: string, id: string): Promise<void> {
    this.entries = this.entries.filter(
      (entry) => !(entry.id === id && entry.storeId === storeId),
    );
  }

  async findByRecurrenceGroup(
    storeId: string,
    groupId: string,
  ): Promise<FinancialEntry[]> {
    return this.entries
      .filter(
        (entry) =>
          entry.storeId === storeId && entry.recurrenceGroupId === groupId,
      )
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  async existsByAppointmentId(
    storeId: string,
    appointmentId: string,
  ): Promise<boolean> {
    return this.entries.some(
      (entry) =>
        entry.storeId === storeId && entry.appointmentId === appointmentId,
    );
  }

  async findByAppointmentId(
    storeId: string,
    appointmentId: string,
  ): Promise<FinancialEntry | null> {
    const found = this.entries.find(
      (entry) =>
        entry.storeId === storeId && entry.appointmentId === appointmentId,
    );
    return found ?? null;
  }

  async listReceivedIncomeInPaidAtRange(
    storeId: string,
    startIsoDate: string,
    endIsoDate: string,
  ): Promise<FinancialEntryLoaded[]> {
    return this.entries
      .filter(
        (entry) =>
          entry.storeId === storeId &&
          entry.type === 'income' &&
          entry.status === 'received' &&
          entry.paidAt !== null &&
          matchesPeriod(entry.paidAt, startIsoDate, endIsoDate),
      )
      .map((entry) => toLoaded(entry, this.clientNames, this.clientPhones));
  }

  async listEntriesForCashflowInRange(
    storeId: string,
    range: { startAt: Date; endAt: Date },
  ): Promise<CashflowDashboardListItem[]> {
    const startIso = toIsoDateOnly(range.startAt);
    const endIso = toIsoDateOnly(range.endAt);
    return this.entries
      .filter((entry) => {
        if (entry.storeId !== storeId) return false;
        if (entry.status === 'cancelled') return false;
        const dueInRange = matchesPeriod(entry.dueDate, startIso, endIso);
        const paidInRange = matchesPeriod(entry.paidAt, startIso, endIso);
        return dueInRange || paidInRange;
      })
      .map((entry) => ({
        id: entry.id,
        type: entry.type,
        dueDate: entry.dueDate,
        paidAt: entry.paidAt,
        valueCents: entry.valueCents,
        paidValueCents: entry.paidValueCents,
      }));
  }

  async listCashflowYears(storeId: string): Promise<number[]> {
    const years = new Set<number>();
    for (const entry of this.entries) {
      if (entry.storeId !== storeId) continue;
      if (entry.status === 'cancelled') continue;
      years.add(entry.dueDate.getUTCFullYear());
      if (entry.paidAt) years.add(entry.paidAt.getUTCFullYear());
    }
    return [...years].sort((a, b) => b - a);
  }

  async listTicketMedioDayMetricsInRange(
    storeId: string,
    range: { startAt: Date; endAt: Date; todayKey: string },
  ): Promise<TicketMedioDayMetricRow[]> {
    const startIso = toIsoDateOnly(range.startAt);
    const endIso = toIsoDateOnly(range.endAt);
    const cappedEnd = endIso < range.todayKey ? endIso : range.todayKey;
    const byDate = new Map<
      string,
      { revenueCents: number; expenseCents: number; clientIds: Set<string> }
    >();

    const ensure = (dateKey: string) => {
      const existing = byDate.get(dateKey);
      if (existing) return existing;
      const created = {
        revenueCents: 0,
        expenseCents: 0,
        clientIds: new Set<string>(),
      };
      byDate.set(dateKey, created);
      return created;
    };

    for (const entry of this.entries) {
      if (entry.storeId !== storeId) continue;
      if (entry.status === 'cancelled') continue;
      if (!entry.paidAt) continue;
      const dateKey = toIsoDateOnly(entry.paidAt);
      if (dateKey < startIso || dateKey > cappedEnd) continue;

      const amount = entry.paidValueCents ?? entry.valueCents;
      if (entry.type === 'income' && entry.status === 'received') {
        const bucket = ensure(dateKey);
        bucket.revenueCents += amount;
        if (entry.clientId) bucket.clientIds.add(entry.clientId);
      } else if (entry.type === 'expense' && entry.status === 'paid') {
        const bucket = ensure(dateKey);
        bucket.expenseCents += amount;
      }
    }

    return [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKey, bucket]) => ({
        dateKey,
        revenueCents: bucket.revenueCents,
        expenseCents: bucket.expenseCents,
        clientIds: [...bucket.clientIds],
      }));
  }

  async listTicketMedioYears(storeId: string): Promise<number[]> {
    const years = new Set<number>();
    for (const entry of this.entries) {
      if (entry.storeId !== storeId) continue;
      if (entry.status === 'cancelled') continue;
      if (!entry.paidAt) continue;
      const isIncome = entry.type === 'income' && entry.status === 'received';
      const isExpense = entry.type === 'expense' && entry.status === 'paid';
      if (!isIncome && !isExpense) continue;
      years.add(entry.paidAt.getUTCFullYear());
    }
    return [...years].sort((a, b) => b - a);
  }

  async listInadimplenciaDebtsInRange(
    storeId: string,
    range: { startAt: Date; endAt: Date; todayKey: string },
  ): Promise<InadimplenciaDashboardDebtRow[]> {
    const startIso = toIsoDateOnly(range.startAt);
    const endIso = toIsoDateOnly(range.endAt);

    const delinquentClientIds = new Set<string>();
    for (const entry of this.entries) {
      if (entry.storeId !== storeId) continue;
      if (entry.type !== 'income') continue;
      if (entry.status !== 'pending') continue;
      if (!entry.clientId) continue;
      if (toIsoDateOnly(entry.dueDate) >= range.todayKey) continue;
      delinquentClientIds.add(entry.clientId);
    }

    return this.entries
      .filter((entry) => {
        if (entry.storeId !== storeId) return false;
        if (entry.type !== 'income') return false;
        if (entry.status !== 'pending' && entry.status !== 'received') {
          return false;
        }
        if (!entry.clientId) return false;
        if (!delinquentClientIds.has(entry.clientId)) return false;
        return matchesPeriod(entry.dueDate, startIso, endIso);
      })
      .sort((a, b) => {
        const byDate = toIsoDateOnly(a.dueDate).localeCompare(
          toIsoDateOnly(b.dueDate),
        );
        return byDate !== 0 ? byDate : a.id.localeCompare(b.id);
      })
      .map((entry) => ({
        id: entry.id,
        dueDate: entry.dueDate,
        description: entry.description,
        valueCents: entry.valueCents,
        status: entry.status as 'pending' | 'received',
        clientId: entry.clientId!,
        clientName: this.clientNames.get(entry.clientId!) ?? 'Cliente',
        phone: this.clientPhones.get(entry.clientId!) ?? null,
      }));
  }

  async listInadimplenciaYears(storeId: string): Promise<number[]> {
    const years = new Set<number>();
    for (const entry of this.entries) {
      if (entry.storeId !== storeId) continue;
      if (entry.type !== 'income') continue;
      if (entry.status !== 'pending' && entry.status !== 'received') continue;
      if (!entry.clientId) continue;
      years.add(entry.dueDate.getUTCFullYear());
    }
    return [...years].sort((a, b) => b - a);
  }

  async listExpenseByCategoryInRange(
    storeId: string,
    range: { startAt: Date; endAt: Date },
  ): Promise<ExpenseByCategoryAggRow[]> {
    const startIso = toIsoDateOnly(range.startAt);
    const endIso = toIsoDateOnly(range.endAt);

    return this.entries
      .filter((entry) => {
        if (entry.storeId !== storeId) return false;
        if (entry.type !== 'expense') return false;
        if (entry.status !== 'paid') return false;
        if (!entry.paidAt) return false;
        return matchesPeriod(entry.paidAt, startIso, endIso);
      })
      .map((entry) => {
        const category = entry.expenseCategoryId
          ? this.expenseCategories.get(entry.expenseCategoryId)
          : undefined;
        return {
          categoryId: entry.expenseCategoryId,
          categoryName: category?.name ?? null,
          categoryColor: category?.color ?? null,
          amountCents: entry.paidValueCents ?? entry.valueCents,
        };
      });
  }

  async listExpenseByCategoryYears(storeId: string): Promise<number[]> {
    const years = new Set<number>();
    for (const entry of this.entries) {
      if (entry.storeId !== storeId) continue;
      if (entry.type !== 'expense') continue;
      if (entry.status !== 'paid') continue;
      if (!entry.paidAt) continue;
      years.add(entry.paidAt.getUTCFullYear());
    }
    return [...years].sort((a, b) => b - a);
  }
}
