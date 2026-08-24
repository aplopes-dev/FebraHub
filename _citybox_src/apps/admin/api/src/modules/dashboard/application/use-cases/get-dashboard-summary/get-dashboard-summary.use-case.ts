import { Injectable, Logger } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';

export interface GetDashboardSummaryDto {
  period?: string;
  startDate?: string;
  endDate?: string;
}

export interface PulseDataPoint {
  month: string;
  clientes: number;
  lojas: number;
  mrr: number;
}

export interface DistributionItem {
  name: string;
  value: number;
  fill: string;
}

export interface VerticalDistributionItem {
  vertical: string;
  lojas: number;
  clientes: number;
}

export interface SubscriptionStatusDistributionItem {
  status: string;
  count: number;
  fill: string;
}

export interface TopClientItem {
  id: string;
  name: string;
  storesCount: number;
  plan: string;
  status: string;
}

export interface RecentActivityItem {
  id: string;
  time: string;
  title: string;
  description: string;
  module: string;
}

export interface DashboardSummaryResult {
  mrrCents: number;
  mrrCentsTrend: string;
  clientsCount: number;
  clientsCountTotal: number;
  clientsCountTrend: string;
  storesCount: number;
  storesCountTotal: number;
  storesCountTrend: string;
  subscribersCount: number;
  subscribersCountTrend: string;
  delinquentCount: number;
  delinquentCountTrend: string;
  teamActiveCount: number;
  pendingInvitesCount: number;
  pulseData: PulseDataPoint[];
  plansDistribution: DistributionItem[];
  clientStatusDistribution: DistributionItem[];
  storeStatusDistribution: DistributionItem[];
  verticalsDistribution: VerticalDistributionItem[];
  subscriptionStatusDistribution: SubscriptionStatusDistributionItem[];
  topClients: TopClientItem[];
  recentActivity: RecentActivityItem[];
}

function resolveDates(period?: string, startDate?: string, endDate?: string) {
  const now = new Date();
  let currentStart = new Date();
  let currentEnd = new Date();

  if (period === 'hoje') {
    currentStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );
    currentEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );
  } else if (period === 'esta-semana') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Segunda-feira
    currentStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      diff,
      0,
      0,
      0,
      0,
    );
    currentEnd = new Date(currentStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
  } else if (period === 'este-mes' || !period) {
    currentStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    currentEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
  } else if (period === 'este-semestre') {
    const currentMonth = now.getMonth();
    const startMonth = currentMonth < 6 ? 0 : 6;
    currentStart = new Date(now.getFullYear(), startMonth, 1, 0, 0, 0, 0);
    currentEnd = new Date(
      now.getFullYear(),
      startMonth + 6,
      0,
      23,
      59,
      59,
      999,
    );
  } else if (startDate && endDate) {
    currentStart = new Date(startDate);
    currentStart.setHours(0, 0, 0, 0);
    currentEnd = new Date(endDate);
    currentEnd.setHours(23, 59, 59, 999);
  } else {
    currentStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    currentEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
  }

  const durationMs = currentEnd.getTime() - currentStart.getTime() + 1;
  const previousStart = new Date(currentStart.getTime() - durationMs);
  const previousEnd = new Date(currentEnd.getTime() - durationMs);

  return {
    currentStart,
    currentEnd,
    previousStart,
    previousEnd,
  };
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);

  if (diffMin < 1) return 'Agora mesmo';
  if (diffMin < 60) return `Há ${diffMin} min`;
  if (diffHours < 24) return `Há ${diffHours}h`;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Ontem';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

interface SubscriptionWithPrice {
  cycle: string;
  planPrice?: {
    priceCents: number;
  } | null;
}

function calculateMrrCents(subscriptions: SubscriptionWithPrice[]): number {
  let total = 0;
  for (const sub of subscriptions) {
    const price = sub.planPrice?.priceCents ?? 0;
    if (sub.cycle === 'MONTHLY') {
      total += price;
    } else if (sub.cycle === 'YEARLY') {
      total += Math.round(price / 12);
    }
  }
  return total;
}

@Injectable()
export class GetDashboardSummaryUseCase implements IUseCase<
  GetDashboardSummaryDto,
  DashboardSummaryResult
> {
  private readonly logger = new Logger(GetDashboardSummaryUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Status de cobrança por loja, derivado — substitui o antigo `Client.status`, que era
   * um campo editável à mão.
   *
   * A precedência importa: uma loja bloqueada que também deve fatura conta **uma vez**,
   * como bloqueada. Somar as categorias sem precedência inflaria o total e faria a
   * distribuição do gráfico não bater com a contagem de clientes.
   */
  private async resolveBillingStatusCounts(): Promise<
    Array<{ status: string; _count: { id: number } }>
  > {
    const [allStores, blockedIds, pastDueIds, activeSubIds] = await Promise.all(
      [
        this.prisma.store.findMany({ select: { id: true } }),
        this.prisma.store.findMany({
          where: { status: 'BLOCKED' },
          select: { id: true },
        }),
        this.prisma.invoice.findMany({
          where: { status: 'PAST_DUE' },
          distinct: ['storeId'],
          select: { storeId: true },
        }),
        this.prisma.subscription.findMany({
          where: { status: { in: ['ACTIVE', 'TRIALING'] } },
          select: { storeId: true },
        }),
      ],
    );

    const blocked = new Set(blockedIds.map((s) => s.id));
    const pastDue = new Set(pastDueIds.map((i) => i.storeId));
    const subscribed = new Set(activeSubIds.map((s) => s.storeId));

    const counts: Record<string, number> = {
      ativo: 0,
      inadimplente: 0,
      bloqueado: 0,
      sem_assinatura: 0,
    };

    for (const { id } of allStores) {
      if (blocked.has(id)) counts.bloqueado += 1;
      else if (pastDue.has(id)) counts.inadimplente += 1;
      else if (subscribed.has(id)) counts.ativo += 1;
      else counts.sem_assinatura += 1;
    }

    return Object.entries(counts).map(([status, id]) => ({
      status,
      _count: { id },
    }));
  }

  async execute(dto: GetDashboardSummaryDto): Promise<DashboardSummaryResult> {
    const { currentStart, currentEnd, previousStart, previousEnd } =
      resolveDates(dto.period, dto.startDate, dto.endDate);

    // Pre-calculate status groups to optimize query count
    const storesStatusGroup = await this.prisma.store.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    // "Cliente" é a Loja desde o PLAT-001, e `Client.status` (ativo/inadimplente/…) não
    // tem equivalente direto em `StoreStatus` — este é operacional, aquele era de
    // cobrança. O status de cobrança passa a ser DERIVADO: bloqueio ganha da
    // inadimplência, que ganha da assinatura ativa.
    const clientsStatusGroup = await this.resolveBillingStatusCounts();

    const clientsCountTotal = clientsStatusGroup.reduce(
      (total, item) => total + item._count.id,
      0,
    );
    const clientsCount =
      clientsStatusGroup.find((i) => i.status === 'ativo')?._count.id ?? 0;
    const delinquentCount =
      clientsStatusGroup.find((i) => i.status === 'inadimplente')?._count.id ??
      0;

    let storesCountTotal = 0;
    let storesCount = 0;

    // `setupStoresCount`/`blockedStoresCount` eram acumulados aqui e nunca lidos —
    // código morto pré-existente, removido na Fase 10 junto da limpeza deste use case.
    for (const item of storesStatusGroup) {
      storesCountTotal += item._count.id;
      if (['PRODUCTION', 'TRAINING', 'IN_SETUP'].includes(item.status)) {
        storesCount += item._count.id;
      }
    }

    // 1. Clients Trends — cada loja nova é um cliente novo (PLAT-001).
    const newClientsCurrent = await this.prisma.store.count({
      where: { createdAt: { gte: currentStart, lte: currentEnd } },
    });
    const newClientsPrevious = await this.prisma.store.count({
      where: { createdAt: { gte: previousStart, lte: previousEnd } },
    });
    const clientsCountTrendDiff = newClientsCurrent - newClientsPrevious;
    const clientsCountTrend =
      clientsCountTrendDiff >= 0
        ? `+${clientsCountTrendDiff}`
        : `${clientsCountTrendDiff}`;

    // 2. Stores Trends
    const newStoresCurrent = await this.prisma.store.count({
      where: { createdAt: { gte: currentStart, lte: currentEnd } },
    });
    const newStoresPrevious = await this.prisma.store.count({
      where: { createdAt: { gte: previousStart, lte: previousEnd } },
    });
    const storesCountTrendDiff = newStoresCurrent - newStoresPrevious;
    const storesCountTrend =
      storesCountTrendDiff >= 0
        ? `+${storesCountTrendDiff}`
        : `${storesCountTrendDiff}`;

    // 3. Financial indicators (MRR, Subscribers, Delinquents)
    let mrrCents = 0;
    let mrrCentsTrend = '+0%';
    let subscribersCount = 0;
    let subscribersCountTrend = '+0%';
    let delinquentCountTrend = '+0%';

    try {
      // MRR Current
      const subsCurrent = await this.prisma.subscription.findMany({
        where: {
          createdAt: { lte: currentEnd },
          OR: [{ canceledAt: null }, { canceledAt: { gt: currentEnd } }],
          status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
        },
        include: { planPrice: true },
      });
      subscribersCount = subsCurrent.length;

      mrrCents = calculateMrrCents(subsCurrent);

      // MRR Previous
      let mrrPrevious = 0;
      const subsPrevious = await this.prisma.subscription.findMany({
        where: {
          createdAt: { lte: previousEnd },
          OR: [{ canceledAt: null }, { canceledAt: { gt: previousEnd } }],
          status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
        },
        include: { planPrice: true },
      });
      const subscribersPreviousCount = subsPrevious.length;

      mrrPrevious = calculateMrrCents(subsPrevious);

      // MRR Trend
      if (mrrPrevious > 0) {
        const diff = Math.round(((mrrCents - mrrPrevious) / mrrPrevious) * 100);
        mrrCentsTrend = diff >= 0 ? `+${diff}%` : `${diff}%`;
      }

      // Subscribers Trend
      if (subscribersPreviousCount > 0) {
        const diff = Math.round(
          ((subscribersCount - subscribersPreviousCount) /
            subscribersPreviousCount) *
            100,
        );
        subscribersCountTrend = diff >= 0 ? `+${diff}%` : `${diff}%`;
      }

      // Delinquents
      const delinquentPrevious = (
        await this.prisma.invoice.findMany({
          where: { status: 'PAST_DUE', dueDate: { lte: previousEnd } },
          distinct: ['storeId'],
          select: { storeId: true },
        })
      ).length;

      if (delinquentPrevious > 0) {
        const diff = Math.round(
          ((delinquentCount - delinquentPrevious) / delinquentPrevious) * 100,
        );
        delinquentCountTrend = diff >= 0 ? `+${diff}%` : `${diff}%`;
      }
    } catch (error) {
      this.logger.error(
        'Falha ao calcular MRR e indicadores financeiros',
        error,
      );
      // Graceful degradation (retains defaults)
    }

    // 4. Team Count
    const teamActiveCount = await this.prisma.user.count();
    const pendingInvitesCount = await this.prisma.member.count({
      where: { hasPassword: false, isActive: true },
    });

    // 5. Distributions
    // 5.1 Client Status Distribution
    const statusMap: Record<string, { label: string; fill: string }> = {
      ativo: { label: 'Ativos', fill: 'var(--orbitly-teal)' },
      inadimplente: {
        label: 'Inadimplentes',
        fill: 'var(--orbitly-ink-muted)',
      },
      bloqueado: { label: 'Bloqueados', fill: 'var(--orbitly-ink)' },
      sem_assinatura: { label: 'Sem assinatura', fill: 'var(--orbitly-sand)' },
    };
    const clientStatusDistribution = clientsStatusGroup.map((item) => ({
      name: statusMap[item.status]?.label ?? item.status,
      value: item._count.id,
      fill: statusMap[item.status]?.fill ?? 'var(--orbitly-sand)',
    }));

    // 5.2 Store Status Distribution
    const storeStatusMap: Record<string, { label: string; fill: string }> = {
      PRODUCTION: { label: 'Ativas', fill: 'var(--orbitly-teal)' },
      IN_SETUP: { label: 'Em setup', fill: 'var(--orbitly-lime)' },
      TRAINING: { label: 'Em treinamento', fill: 'var(--orbitly-sand)' },
      BLOCKED: { label: 'Bloqueadas', fill: 'var(--orbitly-ink)' },
      OFFLINE: { label: 'Offline', fill: 'var(--orbitly-ink-muted)' },
    };
    const storeStatusDistribution = storesStatusGroup.map((item) => ({
      name: storeStatusMap[item.status]?.label ?? item.status,
      value: item._count.id,
      fill: storeStatusMap[item.status]?.fill ?? 'var(--orbitly-sand)',
    }));

    // 5.3 Plans Distribution
    let plansDistribution: DistributionItem[] = [];
    try {
      const subsForPlans = await this.prisma.subscription.findMany({
        where: { status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] } },
        include: { planPrice: { include: { plan: true } } },
      });
      const plansMap = new Map<string, number>();
      for (const sub of subsForPlans) {
        const name =
          sub.planPrice?.plan?.name?.replace('CityBox ', '') ?? 'Sem plano';
        plansMap.set(name, (plansMap.get(name) ?? 0) + 1);
      }
      const colors = [
        'var(--orbitly-lime)',
        'var(--orbitly-teal)',
        'var(--orbitly-ink-muted)',
        'var(--orbitly-lime-soft)',
      ];
      plansDistribution = [...plansMap.entries()].map(
        ([name, value], index) => ({
          name,
          value,
          fill: colors[index % colors.length],
        }),
      );
    } catch (error) {
      this.logger.error('Falha ao calcular distribuicao de planos', error);
      // Graceful degradation (retains defaults)
    }

    // 5.4 Subscription Status Distribution
    let subscriptionStatusDistribution: SubscriptionStatusDistributionItem[] =
      [];
    try {
      const subsGroup = await this.prisma.subscription.groupBy({
        by: ['status'],
        _count: { id: true },
      });
      const subStatusMap: Record<string, { label: string; fill: string }> = {
        ACTIVE: { label: 'Ativas', fill: 'var(--orbitly-teal)' },
        TRIALING: { label: 'Trial', fill: 'var(--orbitly-lime)' },
        PAST_DUE: { label: 'Atrasadas', fill: 'var(--orbitly-sand)' },
        CANCELED: { label: 'Canceladas', fill: 'var(--orbitly-ink-muted)' },
      };
      subscriptionStatusDistribution = subsGroup.map((item) => ({
        status: subStatusMap[item.status]?.label ?? item.status,
        count: item._count.id,
        fill: subStatusMap[item.status]?.fill ?? 'var(--orbitly-sand)',
      }));
    } catch (error) {
      this.logger.error(
        'Falha ao calcular distribuicao de status de assinaturas',
        error,
      );
      // Graceful degradation (retains defaults)
    }

    // 5.5 Verticals Distribution
    //
    // `clientes` era `COUNT(DISTINCT client_id)`. A coluna foi dropada na Fase 10 do
    // PLAT-001 e este `$queryRaw` passou despercebido: SQL cru não é checado pelo `tsc`
    // nem pelo Prisma, e o `.catch` abaixo transformava o erro em log + array vazio —
    // o gráfico ficava vazio sem ninguém perceber.
    //
    // Como a Loja É o cliente desde o PLAT-001, os dois números são o mesmo. O campo
    // permanece para não quebrar o contrato do dashboard.
    const verticalsDistribution = await this.prisma.$queryRaw<
      Array<{ vertical: string; lojas: number; clientes: number }>
    >`
      SELECT
        vertical,
        COUNT(id)::int as lojas,
        COUNT(id)::int as clientes
      FROM platform.stores
      GROUP BY vertical
      ORDER BY lojas DESC
    `.catch((error) => {
      this.logger.error('Falha ao buscar distribuicao por verticais', error);
      return [] as any[];
    });

    // 6. Top Clients — o ranking era por "quantas lojas o cliente tem"; sem Cliente,
    // cada loja é um cliente, então ordena pelas mais recentes com assinatura ativa.
    // `storesCount` fica em 1 por definição e é mantido só para não quebrar o contrato.
    const topStores = await this.prisma.store.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        tradeName: true,
        responsibleName: true,
        status: true,
        subscriptions: {
          where: { status: 'ACTIVE' },
          include: { planPrice: { include: { plan: true } } },
          take: 1,
        },
      },
    });

    const topClients = topStores.map((store) => ({
      id: store.id,
      name: store.responsibleName ?? store.tradeName,
      storesCount: 1,
      plan:
        store.subscriptions[0]?.planPrice?.plan?.name?.replace(
          'CityBox ',
          '',
        ) ?? 'Sem plano',
      status: store.status,
    }));

    // 7. Recent Activity (Audit logs)
    const recentEvents = await this.prisma.storeAuditEvent.findMany({
      take: 5,
      orderBy: { occurredAt: 'desc' },
      include: { store: { select: { tradeName: true } } },
    });

    const moduleMap: Record<string, string> = {
      store: 'lojas',
      stores: 'lojas',
      client: 'clientes',
      clients: 'clientes',
      billing: 'financeiro',
      invoice: 'financeiro',
      invoices: 'financeiro',
      subscription: 'financeiro',
      subscriptions: 'financeiro',
      plan: 'planos',
      plans: 'planos',
      user: 'usuarios',
      users: 'usuarios',
    };

    const recentActivity = recentEvents.map((event) => {
      const normalizedModule = moduleMap[event.module.toLowerCase()] ?? 'lojas';
      return {
        id: event.id,
        time: formatRelativeTime(event.occurredAt),
        title: event.action,
        description:
          event.details ||
          `${event.store?.tradeName ?? 'Loja'} - ${event.actor}`,
        module: normalizedModule,
      };
    });

    // 9. Ecosystem pulse data (last 6 months growth)
    const pulseData: PulseDataPoint[] = [];
    const monthLabels = [
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
    ];
    const now = new Date();
    const sixMonthsAgoStart = new Date(
      now.getFullYear(),
      now.getMonth() - 5,
      1,
      0,
      0,
      0,
      0,
    );
    const maxEndOfM = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const [clientsInPeriod, storesInPeriod, allSubscriptions] =
      await Promise.all([
        // Série "clientes/mês" = lojas criadas por mês (PLAT-001).
        this.prisma.store.findMany({
          where: { createdAt: { gte: sixMonthsAgoStart } },
          select: { createdAt: true },
        }),
        this.prisma.store.findMany({
          where: { createdAt: { gte: sixMonthsAgoStart } },
          select: { createdAt: true },
        }),
        this.prisma.subscription
          .findMany({
            where: {
              createdAt: { lte: maxEndOfM },
              status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
            },
            include: { planPrice: true },
          })
          .catch((error) => {
            this.logger.error(
              'Falha ao buscar assinaturas para o grafico de pulso',
              error,
            );
            return [] as any[];
          }),
      ]);

    for (let offset = 5; offset >= 0; offset -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const startOfM = new Date(
        date.getFullYear(),
        date.getMonth(),
        1,
        0,
        0,
        0,
        0,
      );
      const endOfM = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );

      const clientsInM = clientsInPeriod.filter(
        (c) => c.createdAt >= startOfM && c.createdAt <= endOfM,
      ).length;

      const storesInM = storesInPeriod.filter(
        (s) => s.createdAt >= startOfM && s.createdAt <= endOfM,
      ).length;

      const subsInM = allSubscriptions.filter((sub) => {
        const isCreatedBeforeOrDuringM = sub.createdAt <= endOfM;
        const isNotCanceledOrCanceledAfterM =
          sub.canceledAt === null || sub.canceledAt > endOfM;
        return isCreatedBeforeOrDuringM && isNotCanceledOrCanceledAfterM;
      });
      const mrrInM = calculateMrrCents(subsInM);

      pulseData.push({
        month: monthLabels[date.getMonth()],
        clientes: clientsInM,
        lojas: storesInM,
        mrr: mrrInM / 100, // converted to BRL
      });
    }

    return {
      mrrCents,
      mrrCentsTrend,
      clientsCount,
      clientsCountTotal,
      clientsCountTrend,
      storesCount,
      storesCountTotal,
      storesCountTrend,
      subscribersCount,
      subscribersCountTrend,
      delinquentCount,
      delinquentCountTrend,
      teamActiveCount,
      pendingInvitesCount,
      pulseData,
      plansDistribution,
      clientStatusDistribution,
      storeStatusDistribution,
      verticalsDistribution,
      subscriptionStatusDistribution,
      topClients,
      recentActivity,
    };
  }
}
