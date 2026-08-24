import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { AppointmentRepository } from '../../../../appointments/domain/repositories/appointment.repository.interface';
import type { AppointmentEntity } from '../../../../appointments/domain/entities/appointment.entity';
import { LeadRepository } from '../../../../leads/domain/repositories/lead.repository.interface';
import type { LeadEntity } from '../../../../leads/domain/entities/lead.entity';
import type { ApiLeadStatus } from '../../../../leads/domain/mappers/lead-enum.mapper';
import { PropertyRepository } from '../../../../properties/domain/repositories/property.repository.interface';
import type { PropertyEntity } from '../../../../properties/domain/entities/property.entity';
import { TransactionRepository } from '../../../../transactions/domain/repositories/transaction.repository.interface';
import type { TransactionEntity } from '../../../../transactions/domain/entities/transaction.entity';
import {
  civilDayEndExclusiveInBahia,
  civilDayStartInBahia,
  instantToCivilDate,
  todayDateOnly,
} from '../../../../transactions/application/policies/transaction-date.policy';
import {
  computeGrossRevenueCents,
  type OrganizationType,
} from '../../../../finance/application/policies/gross-revenue.math';
import {
  buildReminders,
  INBOUND_NEW_LEAD_CAP,
  INBOUND_NEW_LEAD_WINDOW_DAYS,
  REMINDER_AVATARS,
  type Reminder,
} from '../../../../reminders/application/policies/build-reminders';

export type DashboardPerformancePeriod = 'monthly' | 'quarterly' | 'yearly';

export type DashboardMetricKey =
  | 'active-leads'
  | 'total-revenue'
  | 'active-listings'
  | 'total-closed';

export type DashboardTrend = {
  value: number;
  direction: 'up' | 'down';
};

export type DashboardMetric = {
  key: DashboardMetricKey;
  label: string;
  valueCents?: number;
  valueCount?: number;
  trend: DashboardTrend;
};

export type DashboardPerformancePoint = {
  label: string;
  revenueAmountCents: number;
  visitsCount: number;
  revenuePct: number;
  visitsPct: number;
};

export type DashboardPerformance = {
  period: DashboardPerformancePeriod;
  points: DashboardPerformancePoint[];
  highlightedIndex: number;
  targetAmountCents: number;
};

export type DashboardDeals = {
  closed: number;
  inProgress: number;
};

export type DashboardReminder = Reminder;

/** Módulos visíveis conforme permissões CASL da loja. */
export type DashboardModules = {
  leads: boolean;
  properties: boolean;
  transactions: boolean;
  finance: boolean;
  calendar: boolean;
};

export type DashboardOverview = {
  metrics: DashboardMetric[];
  performance: DashboardPerformance;
  deals: DashboardDeals;
  listings: PropertyEntity[];
  leads: LeadEntity[];
  reminders: DashboardReminder[];
  modules: DashboardModules;
};

export type GetDashboardOverviewInput = {
  storeId: string;
  organizationType: OrganizationType;
  /**
   * Quando definido, restringe leads/imóveis/negócios/agenda ao corretor
   * (desempenho pessoal). Admin/loja inteira → omitir.
   */
  scopeAgentId?: string;
  /**
   * Ainda usado na regra SINGLE_AGENT de receita (comissão do corretor).
   * Em AGENCY com escopo pessoal as transações já vêm filtradas.
   */
  actorAgentId?: string;
  modules?: Partial<DashboardModules>;
  period?: DashboardPerformancePeriod;
  /** Override do “agora” — só testes. */
  now?: Date;
};

const OPEN_LEAD_STATUSES: readonly ApiLeadStatus[] = [
  'new',
  'negotiating',
  'scheduled-visit',
];

const IN_PROGRESS_STATUSES = ['DRAFT', 'PROPOSAL', 'CONTRACT_SIGNED'] as const;

const LISTINGS_PREVIEW = 8;
const LEADS_PREVIEW = 6;
const APPOINTMENT_WINDOW_DAYS = 6;

const MONTH_LABELS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
] as const;

const ALL_MODULES: DashboardModules = {
  leads: true,
  properties: true,
  transactions: true,
  finance: true,
  calendar: true,
};

function resolveModules(partial?: Partial<DashboardModules>): DashboardModules {
  return {
    leads: partial?.leads ?? true,
    properties: partial?.properties ?? true,
    transactions: partial?.transactions ?? true,
    finance: partial?.finance ?? true,
    calendar: partial?.calendar ?? true,
  };
}

function transactionsForAgent(
  items: readonly TransactionEntity[],
  agentId: string | undefined,
): TransactionEntity[] {
  if (!agentId) return [...items];
  return items.filter(
    (tx) => tx.captorId === agentId || tx.sellerId === agentId,
  );
}

@Injectable()
export class GetDashboardOverviewUseCase implements IUseCase<
  GetDashboardOverviewInput,
  DashboardOverview
> {
  constructor(
    private readonly transactions: TransactionRepository,
    private readonly leads: LeadRepository,
    private readonly properties: PropertyRepository,
    private readonly appointments: AppointmentRepository,
  ) {}

  async execute(input: GetDashboardOverviewInput): Promise<DashboardOverview> {
    const now = input.now ?? new Date();
    const period = input.period ?? 'monthly';
    const today = todayDateOnly(now);
    const modules = resolveModules(input.modules);
    const agentId = input.scopeAgentId?.trim() || undefined;
    const revenueActorId = input.actorAgentId?.trim() || agentId;

    const buckets = buildBuckets(period, now);
    const chartFrom = buckets[0].from;
    const chartToExclusive = buckets[buckets.length - 1].toExclusive;

    const monthStart = startOfCivilMonth(now);
    const prevMonthStart = addCivilMonths(monthStart, -1);
    const thisMonthFrom = monthStartInstant(monthStart);
    const prevMonthFrom = monthStartInstant(prevMonthStart);
    const prevMonthEndExclusive = thisMonthFrom;

    const followUpUntil = new Date(`${today}T00:00:00.000Z`);

    const agentListFilter = agentId ? { agentId } : {};

    const [
      allTransactionsRaw,
      activeLeadsAll,
      availableListingsAll,
      followUpLeads,
      inboundNewLeads,
      upcomingAppointments,
      chartAppointments,
    ] = await Promise.all([
      modules.transactions || modules.finance
        ? this.transactions.findAllForStore(input.storeId)
        : Promise.resolve([] as TransactionEntity[]),
      modules.leads
        ? this.leads.findMany(input.storeId, {
            page: 1,
            perPage: 2000,
            status: [...OPEN_LEAD_STATUSES],
            ...agentListFilter,
          })
        : Promise.resolve({ items: [] as LeadEntity[], total: 0 }),
      modules.properties
        ? this.properties.findMany(input.storeId, {
            page: 1,
            perPage: 2000,
            status: ['available'],
            ...agentListFilter,
          })
        : Promise.resolve({ items: [] as PropertyEntity[], total: 0 }),
      modules.leads
        ? this.leads.findMany(input.storeId, {
            page: 1,
            perPage: REMINDER_AVATARS,
            status: [...OPEN_LEAD_STATUSES],
            followUpUntil,
            ...agentListFilter,
          })
        : Promise.resolve({ items: [] as LeadEntity[], total: 0 }),
      modules.leads
        ? this.leads.findMany(input.storeId, {
            page: 1,
            perPage: INBOUND_NEW_LEAD_CAP,
            status: ['new'],
            leadSource: ['website', 'whatsapp'],
            createdAtFrom: new Date(
              now.getTime() -
                INBOUND_NEW_LEAD_WINDOW_DAYS * 24 * 60 * 60 * 1000,
            ),
            ...agentListFilter,
          })
        : Promise.resolve({ items: [] as LeadEntity[], total: 0 }),
      modules.calendar
        ? this.appointments.findMany(input.storeId, {
            page: 1,
            perPage: 200,
            from: civilDayStartInBahia(today, 'from'),
            toExclusive: civilDayEndExclusiveInBahia(
              addDaysIso(today, APPOINTMENT_WINDOW_DAYS),
              'to',
            ),
            done: false,
            ...agentListFilter,
          })
        : Promise.resolve({ items: [] as AppointmentEntity[], total: 0 }),
      modules.calendar
        ? this.appointments.findMany(input.storeId, {
            page: 1,
            perPage: 2000,
            from: chartFrom,
            toExclusive: chartToExclusive,
            kind: ['visit'],
            ...agentListFilter,
          })
        : Promise.resolve({ items: [] as AppointmentEntity[], total: 0 }),
    ]);

    const allTransactions = transactionsForAgent(allTransactionsRaw, agentId);

    const totalRevenueCents = modules.finance
      ? computeGrossRevenueCents(
          allTransactions,
          input.organizationType,
          revenueActorId,
        )
      : 0;

    const revenueThisMonth = modules.finance
      ? computeGrossRevenueCents(
          allTransactions.filter((tx) =>
            inInstantRange(tx.createdAt, thisMonthFrom, now),
          ),
          input.organizationType,
          revenueActorId,
        )
      : 0;
    const revenuePrevMonth = modules.finance
      ? computeGrossRevenueCents(
          allTransactions.filter((tx) =>
            inInstantRange(tx.createdAt, prevMonthFrom, prevMonthEndExclusive),
          ),
          input.organizationType,
          revenueActorId,
        )
      : 0;

    const closedAll = modules.transactions
      ? allTransactions.filter((tx) => tx.status === 'COMPLETED')
      : [];
    const closedThisMonth = closedAll.filter((tx) =>
      inInstantRange(tx.createdAt, thisMonthFrom, now),
    ).length;
    const closedPrevMonth = closedAll.filter((tx) =>
      inInstantRange(tx.createdAt, prevMonthFrom, prevMonthEndExclusive),
    ).length;

    const inProgress = modules.transactions
      ? allTransactions.filter((tx) =>
          (IN_PROGRESS_STATUSES as readonly string[]).includes(tx.status),
        )
      : [];

    const metrics: DashboardMetric[] = [];

    if (modules.leads) {
      metrics.push({
        key: 'active-leads',
        label: 'Leads ativos',
        valueCount: activeLeadsAll.total,
        trend: trendFrom(
          countCreatedInRange(activeLeadsAll.items, thisMonthFrom, now),
          countCreatedInRange(
            activeLeadsAll.items,
            prevMonthFrom,
            prevMonthEndExclusive,
          ),
        ),
      });
    }

    if (modules.finance) {
      metrics.push({
        key: 'total-revenue',
        label: 'Receita total',
        valueCents: totalRevenueCents,
        trend: trendFrom(revenueThisMonth, revenuePrevMonth),
      });
    }

    if (modules.properties) {
      metrics.push({
        key: 'active-listings',
        label: 'Imóveis ativos',
        valueCount: availableListingsAll.total,
        trend: trendFrom(
          countCreatedInRange(availableListingsAll.items, thisMonthFrom, now),
          countCreatedInRange(
            availableListingsAll.items,
            prevMonthFrom,
            prevMonthEndExclusive,
          ),
        ),
      });
    }

    if (modules.transactions) {
      metrics.push({
        key: 'total-closed',
        label: 'Negócios fechados',
        valueCount: closedAll.length,
        trend: trendFrom(closedThisMonth, closedPrevMonth),
      });
    }

    const performance =
      modules.finance || modules.calendar
        ? buildPerformance(
            period,
            buckets,
            modules.finance ? allTransactions : [],
            modules.calendar ? chartAppointments.items : [],
            input.organizationType,
            revenueActorId,
            now,
          )
        : emptyPerformance(period, buckets);

    return {
      metrics,
      performance,
      deals: modules.transactions
        ? {
            closed: closedAll.length,
            inProgress: inProgress.length,
          }
        : { closed: 0, inProgress: 0 },
      listings: modules.properties
        ? availableListingsAll.items.slice(0, LISTINGS_PREVIEW)
        : [],
      leads: modules.leads ? activeLeadsAll.items.slice(0, LEADS_PREVIEW) : [],
      reminders: buildReminders(
        followUpLeads,
        upcomingAppointments.items,
        inboundNewLeads.items,
      ),
      modules,
    };
  }
}

type CivilMonth = { year: number; month: number };

type Bucket = {
  label: string;
  from: Date;
  toExclusive: Date;
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function startOfCivilMonth(now: Date): CivilMonth {
  const iso = todayDateOnly(now);
  const [y, m] = iso.split('-').map(Number);
  return { year: y, month: m };
}

function addCivilMonths(base: CivilMonth, delta: number): CivilMonth {
  const idx = base.year * 12 + (base.month - 1) + delta;
  return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
}

function monthStartInstant(month: CivilMonth): Date {
  return civilDayStartInBahia(`${month.year}-${pad(month.month)}-01`, 'from');
}

function monthEndExclusive(month: CivilMonth): Date {
  const next = addCivilMonths(month, 1);
  return monthStartInstant(next);
}

function inInstantRange(at: Date, from: Date, toExclusive: Date): boolean {
  const t = at.getTime();
  return t >= from.getTime() && t < toExclusive.getTime();
}

function countCreatedInRange(
  items: readonly { createdAt: Date }[],
  from: Date,
  toExclusive: Date,
): number {
  return items.filter((item) =>
    inInstantRange(item.createdAt, from, toExclusive),
  ).length;
}

function trendFrom(current: number, previous: number): DashboardTrend {
  if (previous === 0) {
    if (current === 0) return { value: 0, direction: 'up' };
    return { value: 100, direction: 'up' };
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  return {
    value: Math.abs(pct),
    direction: pct >= 0 ? 'up' : 'down',
  };
}

function buildBuckets(period: DashboardPerformancePeriod, now: Date): Bucket[] {
  const current = startOfCivilMonth(now);

  if (period === 'monthly') {
    const count = 8;
    const start = addCivilMonths(current, -(count - 1));
    return Array.from({ length: count }, (_, i) => {
      const month = addCivilMonths(start, i);
      return {
        label: MONTH_LABELS[month.month - 1],
        from: monthStartInstant(month),
        toExclusive: monthEndExclusive(month),
      };
    });
  }

  if (period === 'quarterly') {
    const count = 4;
    const quarterIndex = Math.floor((current.month - 1) / 3);
    const currentQuarterStartMonth = quarterIndex * 3 + 1;
    const currentQuarter: CivilMonth = {
      year: current.year,
      month: currentQuarterStartMonth,
    };
    const start = addCivilMonths(currentQuarter, -(count - 1) * 3);
    return Array.from({ length: count }, (_, i) => {
      const qStart = addCivilMonths(start, i * 3);
      const qEnd = addCivilMonths(qStart, 3);
      const qNum = Math.floor((qStart.month - 1) / 3) + 1;
      return {
        label: `T${qNum}`,
        from: monthStartInstant(qStart),
        toExclusive: monthStartInstant(qEnd),
      };
    });
  }

  const count = 5;
  const startYear = current.year - (count - 1);
  return Array.from({ length: count }, (_, i) => {
    const year = startYear + i;
    return {
      label: String(year),
      from: monthStartInstant({ year, month: 1 }),
      toExclusive: monthStartInstant({ year: year + 1, month: 1 }),
    };
  });
}

function emptyPerformance(
  period: DashboardPerformancePeriod,
  buckets: Bucket[],
): DashboardPerformance {
  return {
    period,
    points: buckets.map((b) => ({
      label: b.label,
      revenueAmountCents: 0,
      visitsCount: 0,
      revenuePct: 0,
      visitsPct: 0,
    })),
    highlightedIndex: buckets.length - 1,
    targetAmountCents: 1,
  };
}

function buildPerformance(
  period: DashboardPerformancePeriod,
  buckets: Bucket[],
  transactions: readonly TransactionEntity[],
  visits: readonly AppointmentEntity[],
  organizationType: OrganizationType,
  actorAgentId: string | undefined,
  now: Date,
): DashboardPerformance {
  const raw = buckets.map((bucket) => {
    const txs = transactions.filter((tx) =>
      inInstantRange(tx.createdAt, bucket.from, bucket.toExclusive),
    );
    const revenueAmountCents = computeGrossRevenueCents(
      txs,
      organizationType,
      actorAgentId,
    );
    const visitsCount = visits.filter((a) =>
      inInstantRange(a.startsAt, bucket.from, bucket.toExclusive),
    ).length;
    return { label: bucket.label, revenueAmountCents, visitsCount };
  });

  const maxRevenue = Math.max(0, ...raw.map((p) => p.revenueAmountCents));
  const maxVisits = Math.max(0, ...raw.map((p) => p.visitsCount));
  const targetAmountCents = maxRevenue > 0 ? maxRevenue : 1;

  const points: DashboardPerformancePoint[] = raw.map((p) => ({
    label: p.label,
    revenueAmountCents: p.revenueAmountCents,
    visitsCount: p.visitsCount,
    revenuePct:
      maxRevenue === 0
        ? 0
        : Math.min(100, Math.round((100 * p.revenueAmountCents) / maxRevenue)),
    visitsPct:
      maxVisits === 0
        ? 0
        : Math.min(100, Math.round((100 * p.visitsCount) / maxVisits)),
  }));

  const highlightedIndex = buckets.findIndex((bucket) =>
    inInstantRange(now, bucket.from, bucket.toExclusive),
  );

  return {
    period,
    points,
    highlightedIndex:
      highlightedIndex >= 0 ? highlightedIndex : points.length - 1,
    targetAmountCents,
  };
}

function addDaysIso(iso: string, days: number): string {
  const start = civilDayStartInBahia(iso, 'from');
  const next = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
  return instantToCivilDate(next);
}

export { ALL_MODULES };
