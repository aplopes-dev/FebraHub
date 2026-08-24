import { PosCashSession } from '../../../domain/entities/pos-cash-session.entity';
import { InMemoryPosCashSessionRepository } from '../../../tests/in-memory-pos-cash-session.repository';
import { ListCurrentSessionSalesUseCase } from './list-current-session-sales.use-case';

const ORGANIZATION_ID = '11111111-1111-4111-8111-111111111111';
const TERMINAL_ID = '22222222-2222-4222-8222-222222222222';
const SESSION_ID = '33333333-3333-4333-8333-333333333333';
const OPERATOR_ID = '44444444-4444-4444-8444-444444444444';

describe('ListCurrentSessionSalesUseCase', () => {
  it('sem sessão open devolve lista vazia', async () => {
    const repo = new InMemoryPosCashSessionRepository();
    const useCase = new ListCurrentSessionSalesUseCase(repo);

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      posTerminalId: TERMINAL_ID,
    });

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('com sessão open lista vendas da sessão', async () => {
    const repo = new InMemoryPosCashSessionRepository();
    await repo.save(
      PosCashSession.create(
        {
          organizationId: ORGANIZATION_ID,
          branchId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          posTerminalId: TERMINAL_ID,
          openedByUserId: OPERATOR_ID,
          openedByName: 'Maria',
          openingFloatCents: 0,
        },
        SESSION_ID,
      ),
    );
    repo.registerSale({
      id: 'sale-1',
      sessionId: SESSION_ID,
      number: 1,
      customerName: 'Cliente',
      sellerName: '',
      operatorName: 'Maria',
      status: 'closed',
      totalCents: 1000,
      createdAt: new Date(),
      updatedAt: new Date(),
      lines: [],
      payments: [],
    });

    const useCase = new ListCurrentSessionSalesUseCase(repo);
    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      posTerminalId: TERMINAL_ID,
    });

    expect(result.total).toBe(1);
    expect(result.items[0]?.id).toBe('sale-1');
    expect(result.items[0]?.number).toBe(1);
    expect(result.items[0]?.operatorName).toBe('Maria');
  });
});
