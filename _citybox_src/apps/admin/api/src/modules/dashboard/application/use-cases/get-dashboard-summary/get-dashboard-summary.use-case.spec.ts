/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { GetDashboardSummaryUseCase } from './get-dashboard-summary.use-case';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';

/**
 * Desde a Fase 10 (ADR PLAT-001) não existe mais `Client`: a Loja é o cliente. O status
 * de cobrança deixou de ser um campo (`Client.status`) e passou a ser DERIVADO por loja,
 * com precedência `bloqueado` > `inadimplente` > `ativo` > `sem_assinatura`.
 *
 * O cenário abaixo monta 13 lojas cobrindo as quatro categorias, incluindo uma loja que
 * é bloqueada E inadimplente E assinante ao mesmo tempo — ela precisa contar UMA vez,
 * como bloqueada, senão a distribuição não fecharia com o total de clientes.
 */
const ACTIVE_STORE_IDS = [
  'store-1',
  'store-2',
  'store-3',
  'store-4',
  'store-5',
  'store-6',
  'store-7',
  'store-8',
  'store-9',
];
const PAST_DUE_ONLY_STORE_IDS = ['store-10', 'store-11'];
const BLOCKED_STORE_ID = 'store-12';
const NO_SUBSCRIPTION_STORE_ID = 'store-13';

const ALL_STORE_IDS = [
  ...ACTIVE_STORE_IDS,
  ...PAST_DUE_ONLY_STORE_IDS,
  BLOCKED_STORE_ID,
  NO_SUBSCRIPTION_STORE_ID,
];

function buildTopStoreRow(id: string, planName: string | null) {
  return {
    id,
    tradeName: `Loja ${id}`,
    responsibleName: `Responsável ${id}`,
    status: 'PRODUCTION',
    subscriptions: planName
      ? [{ planPrice: { plan: { name: `CityBox ${planName}` } } }]
      : [],
  };
}

describe('GetDashboardSummaryUseCase', () => {
  it('should compile dashboard summary indicators, trends, distributions and activity feed', async () => {
    const mockPrisma = {
      store: {
        count: jest.fn().mockImplementation((args) => {
          if (args?.where?.createdAt?.gte) {
            // Novas lojas no período — serve para clientes e lojas, já que a loja é o cliente.
            return Promise.resolve(3);
          }
          return Promise.resolve(ALL_STORE_IDS.length);
        }),
        findMany: jest.fn().mockImplementation((args) => {
          if (args?.where?.status === 'BLOCKED') {
            return Promise.resolve([{ id: BLOCKED_STORE_ID }]);
          }
          if (args?.select?.createdAt) {
            // Série do gráfico de pulso.
            return Promise.resolve([{ createdAt: new Date() }]);
          }
          if (args?.take === 5) {
            return Promise.resolve([
              buildTopStoreRow('store-1', 'Prata'),
              buildTopStoreRow('store-2', 'Prata'),
              buildTopStoreRow('store-3', null),
            ]);
          }
          return Promise.resolve(ALL_STORE_IDS.map((id) => ({ id })));
        }),
        groupBy: jest.fn().mockResolvedValue([
          { status: 'PRODUCTION', _count: { id: 6 } },
          { status: 'IN_SETUP', _count: { id: 2 } },
          { status: 'BLOCKED', _count: { id: 1 } },
        ]),
      },
      subscription: {
        findMany: jest.fn().mockImplementation((args) => {
          if (args?.select?.storeId) {
            // Assinaturas ativas/trial usadas para derivar o status de cobrança.
            return Promise.resolve(
              [...ACTIVE_STORE_IDS, BLOCKED_STORE_ID].map((storeId) => ({
                storeId,
              })),
            );
          }
          // Consultas de MRR/planos/pulso: vazias para exercitar a degradação graciosa.
          return Promise.resolve([]);
        }),
        groupBy: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      invoice: {
        findMany: jest.fn().mockImplementation((args) => {
          if (args?.where?.dueDate?.lte) {
            // Inadimplentes do período anterior (base do trend).
            return Promise.resolve([{ storeId: PAST_DUE_ONLY_STORE_IDS[0] }]);
          }
          return Promise.resolve(
            [...PAST_DUE_ONLY_STORE_IDS, BLOCKED_STORE_ID].map((storeId) => ({
              storeId,
            })),
          );
        }),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      user: {
        count: jest.fn().mockResolvedValue(4),
      },
      member: {
        count: jest.fn().mockResolvedValue(1),
      },
      storeAuditEvent: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'act-1',
            storeId: 'store-1',
            occurredAt: new Date(),
            severity: 'info',
            actor: 'Admin',
            module: 'stores',
            action: 'STORE_CONFIG_CHANGED',
            details: 'Configurações de horário editadas',
            store: { tradeName: 'Mercado Ideal' },
          },
        ]),
      },
      $queryRaw: jest.fn().mockResolvedValue([
        { vertical: 'food', lojas: 1, clientes: 1 },
        { vertical: 'varejo', lojas: 1, clientes: 1 },
      ]),
    } as unknown as PrismaService;

    const useCase = new GetDashboardSummaryUseCase(mockPrisma);
    const result = await useCase.execute({ period: 'este-mes' });

    // Cada loja é um cliente: o total de clientes é a contagem de lojas.
    expect(result.clientsCountTotal).toBe(13);
    expect(result.clientsCount).toBe(9);
    expect(result.delinquentCount).toBe(2);
    expect(result.storesCountTotal).toBe(9);
    expect(result.storesCount).toBe(8);
    expect(result.teamActiveCount).toBe(4);
    expect(result.pendingInvitesCount).toBe(1);

    // Check fallback values for subscription tables (graceful degradation)
    expect(result.mrrCents).toBe(0);
    expect(result.subscribersCount).toBe(0);

    // Trend de inadimplência: 2 agora contra 1 no período anterior.
    expect(result.delinquentCountTrend).toBe('+100%');

    // A precedência garante que a loja bloqueada + inadimplente + assinante conte uma
    // vez só, então a distribuição soma exatamente o total de clientes.
    expect(result.clientStatusDistribution).toEqual([
      expect.objectContaining({ name: 'Ativos', value: 9 }),
      expect.objectContaining({ name: 'Inadimplentes', value: 2 }),
      expect.objectContaining({ name: 'Bloqueados', value: 1 }),
      expect.objectContaining({ name: 'Sem assinatura', value: 1 }),
    ]);
    const distributionTotal = result.clientStatusDistribution.reduce(
      (total, item) => total + item.value,
      0,
    );
    expect(distributionTotal).toBe(result.clientsCountTotal);

    // "Top clientes" virou o ranking das lojas mais recentes; `storesCount` é 1 por
    // definição, mantido apenas para não quebrar o contrato do painel.
    expect(result.topClients).toHaveLength(3);
    expect(result.topClients[0]).toEqual({
      id: 'store-1',
      name: 'Responsável store-1',
      storesCount: 1,
      plan: 'Prata',
      status: 'PRODUCTION',
    });
    expect(result.topClients[2].plan).toBe('Sem plano');

    // Check activity feed
    expect(result.recentActivity).toHaveLength(1);
    expect(result.recentActivity[0].title).toBe('STORE_CONFIG_CHANGED');
    expect(result.recentActivity[0].module).toBe('lojas');
  });
});
