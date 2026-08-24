import { CancelStockTransferUseCase } from './cancel-stock-transfer.use-case';
import { CreateStockTransferUseCase } from '../create-stock-transfer/create-stock-transfer.use-case';
import { makeStock } from '../../../tests/stocks-test-factory';
import { InMemoryStockTransferRepository } from '../../../tests/in-memory-stock-transfer.repository';
import { InMemoryStockRepository } from '../../../tests/in-memory-stock.repository';
import {
  InMemoryStockMovementRepository,
  InMemoryStockProductLookup,
} from '../../../tests/in-memory-stock-movement.repository';
import { InMemoryCarrierRepository } from '../../../carriers/tests/in-memory-carrier.repository';
import {
  BRANCH_ID,
  ORGANIZATION_ID,
} from '../../../../tenancy/tests/tenancy-test-factory';
import { Prisma } from '../../../../../../generated/prisma/client';

const FROM_STOCK = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const TO_STOCK = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const PRODUCT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

describe('CancelStockTransferUseCase', () => {
  async function setupWithTransfer() {
    const stockRepository = new InMemoryStockRepository();
    const stockMovementRepository = new InMemoryStockMovementRepository();
    const stockProductLookup = new InMemoryStockProductLookup();
    const stockTransferRepository = new InMemoryStockTransferRepository(
      stockMovementRepository,
    );

    await stockRepository.save(
      makeStock({ id: FROM_STOCK, branchIds: [BRANCH_ID] }),
    );
    await stockRepository.save(
      makeStock({ id: TO_STOCK, branchIds: [BRANCH_ID] }),
    );
    stockProductLookup.set({
      id: PRODUCT_ID,
      trackStock: true,
      deletedAt: null,
    });
    stockMovementRepository.balances.set(
      `${FROM_STOCK}::${PRODUCT_ID}`,
      new Prisma.Decimal('10'),
    );

    const create = new CreateStockTransferUseCase(
      stockTransferRepository,
      stockRepository,
      stockProductLookup,
      new InMemoryCarrierRepository(),
    );
    const cancel = new CancelStockTransferUseCase(stockTransferRepository);

    const transfer = await create.execute({
      organizationId: ORGANIZATION_ID,
      fromStockId: FROM_STOCK,
      toStockId: TO_STOCK,
      operatedAt: new Date('2026-07-28T12:00:00.000Z'),
      responsibleName: 'Operador',
      createdByUserId: USER_ID,
      lines: [{ productId: PRODUCT_ID, quantity: '4' }],
    });

    return {
      cancel,
      stockMovementRepository,
      stockTransferRepository,
      transfer,
    };
  }

  it('estorna saldos ao cancelar', async () => {
    const { cancel, stockMovementRepository, transfer } =
      await setupWithTransfer();

    const result = await cancel.execute({
      organizationId: ORGANIZATION_ID,
      id: transfer.id,
      createdByUserId: USER_ID,
    });

    expect(result.transfer.status).toBe('cancelled');
    expect(result.transfer.cancelledAt).toBeTruthy();
    expect(stockMovementRepository.movements.size).toBe(4);

    const fromQty = await stockMovementRepository.getBalanceQuantity(
      ORGANIZATION_ID,
      FROM_STOCK,
      PRODUCT_ID,
    );
    const toQty = await stockMovementRepository.getBalanceQuantity(
      ORGANIZATION_ID,
      TO_STOCK,
      PRODUCT_ID,
    );
    expect(fromQty).toBe('10');
    expect(toQty).toBe('0');
  });

  it('cancel idempotente se já cancelled', async () => {
    const { cancel, stockMovementRepository, transfer } =
      await setupWithTransfer();

    await cancel.execute({
      organizationId: ORGANIZATION_ID,
      id: transfer.id,
      createdByUserId: USER_ID,
    });
    const again = await cancel.execute({
      organizationId: ORGANIZATION_ID,
      id: transfer.id,
      createdByUserId: USER_ID,
    });

    expect(again.transfer.status).toBe('cancelled');
    expect(stockMovementRepository.movements.size).toBe(4);
  });

  it('cancelamento concorrente não estorna em dobro', async () => {
    // O use-case lê o status FORA da transação. Aqui simulamos a corrida:
    // a leitura devolve a transferência ainda ATIVA (snapshot obsoleto)
    // enquanto o repositório já a tem como cancelada — é exatamente o que
    // acontece com dois cliques simultâneos em Cancelar.
    const { cancel, stockTransferRepository, stockMovementRepository, transfer } =
      await setupWithTransfer();

    const staleActive = await stockTransferRepository.findById(
      ORGANIZATION_ID,
      transfer.id,
    );
    expect(staleActive?.status).toBe('active');

    // Vencedor da corrida.
    await cancel.execute({
      organizationId: ORGANIZATION_ID,
      id: transfer.id,
      createdByUserId: USER_ID,
    });
    expect(stockMovementRepository.movements.size).toBe(4);

    // Perdedor: entra com o snapshot obsoleto e passa da guarda do use-case.
    jest
      .spyOn(stockTransferRepository, 'findById')
      .mockResolvedValueOnce(staleActive);

    const result = await cancel.execute({
      organizationId: ORGANIZATION_ID,
      id: transfer.id,
      createdByUserId: USER_ID,
    });

    // Nenhum movimento novo, e devolve o estado real.
    expect(stockMovementRepository.movements.size).toBe(4);
    expect(result.transfer.status).toBe('cancelled');

    const fromQty = await stockMovementRepository.getBalanceQuantity(
      ORGANIZATION_ID,
      FROM_STOCK,
      PRODUCT_ID,
    );
    expect(fromQty).toBe('10');
  });
});
