/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ListGlobalAuditUseCase } from './list-global-audit.use-case';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';

describe('ListGlobalAuditUseCase', () => {
  it('should list global audit events with pagination and formatting', async () => {
    const mockEventDate = new Date('2026-07-23T12:00:00.000Z');
    const mockEvents = [
      {
        id: 'event-1',
        storeId: 'store-1',
        store: { tradeName: 'Loja Teste' },
        occurredAt: mockEventDate,
        severity: 'info',
        actor: 'Carlos Operator',
        actorRole: 'platform_operator',
        module: 'stores',
        action: 'STORE_CREATED',
        details: 'Nova loja cadastrada no sistema',
        createdAt: mockEventDate,
      },
    ];

    const mockPrisma = {
      storeAuditEvent: {
        findMany: jest.fn().mockResolvedValue(mockEvents),
        count: jest.fn().mockResolvedValue(1),
      },
    } as unknown as PrismaService;

    const useCase = new ListGlobalAuditUseCase(mockPrisma);
    const result = await useCase.execute({ page: 1, perPage: 10 });

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockPrisma.storeAuditEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 10,
      }),
    );
    expect(result.data).toHaveLength(1);
    expect(result.data[0].storeName).toBe('Loja Teste');
    expect(result.data[0].actor).toBe('Carlos Operator');
    expect(result.meta.total).toBe(1);
    expect(result.meta.totalPages).toBe(1);
  });

  it('should apply search filters when search is provided', async () => {
    const mockPrisma = {
      storeAuditEvent: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    } as unknown as PrismaService;

    const useCase = new ListGlobalAuditUseCase(mockPrisma);
    await useCase.execute({ search: 'Carlos' });

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockPrisma.storeAuditEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({
              actor: expect.objectContaining({ contains: 'Carlos' }),
            }),
          ]),
        }),
      }),
    );
  });
});
