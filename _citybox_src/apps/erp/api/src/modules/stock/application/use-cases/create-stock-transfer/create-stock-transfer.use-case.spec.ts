import { CreateStockTransferUseCase } from './create-stock-transfer.use-case';
import { StockTransferSameStockError } from '../../../domain/errors/stock-transfer-same-stock.error';
import { CarrierNotFoundError } from '../../../carriers/domain/errors/carrier-not-found.error';
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
const MISSING_CARRIER = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

describe('CreateStockTransferUseCase', () => {
  function setup() {
    const stockRepository = new InMemoryStockRepository();
    const stockMovementRepository = new InMemoryStockMovementRepository();
    const stockProductLookup = new InMemoryStockProductLookup();
    const stockTransferRepository = new InMemoryStockTransferRepository(
      stockMovementRepository,
    );
    const carrierRepository = new InMemoryCarrierRepository();

    const useCase = new CreateStockTransferUseCase(
      stockTransferRepository,
      stockRepository,
      stockProductLookup,
      carrierRepository,
    );

    return {
      useCase,
      stockRepository,
      stockMovementRepository,
      stockProductLookup,
      stockTransferRepository,
      carrierRepository,
    };
  }

  async function seed(repos: ReturnType<typeof setup>) {
    await repos.stockRepository.save(
      makeStock({ id: FROM_STOCK, name: 'Origem', branchIds: [BRANCH_ID] }),
    );
    await repos.stockRepository.save(
      makeStock({ id: TO_STOCK, name: 'Destino', branchIds: [BRANCH_ID] }),
    );
    repos.stockTransferRepository.setStockName(FROM_STOCK, 'Origem');
    repos.stockTransferRepository.setStockName(TO_STOCK, 'Destino');
    repos.stockProductLookup.set({
      id: PRODUCT_ID,
      trackStock: true,
      deletedAt: null,
    });
    repos.stockMovementRepository.balances.set(
      `${FROM_STOCK}::${PRODUCT_ID}`,
      new Prisma.Decimal('10'),
    );
  }

  it('cria transferência e altera 2 balances', async () => {
    const repos = setup();
    await seed(repos);

    const transfer = await repos.useCase.execute({
      organizationId: ORGANIZATION_ID,
      fromStockId: FROM_STOCK,
      toStockId: TO_STOCK,
      operatedAt: new Date('2026-07-28T12:00:00.000Z'),
      responsibleName: 'Operador',
      createdByUserId: USER_ID,
      lines: [{ productId: PRODUCT_ID, quantity: '3' }],
    });

    expect(transfer.status).toBe('active');
    expect(transfer.outboundMovementId).toBeTruthy();
    expect(transfer.inboundMovementId).toBeTruthy();
    expect(repos.stockMovementRepository.movements.size).toBe(2);

    const fromQty = await repos.stockMovementRepository.getBalanceQuantity(
      ORGANIZATION_ID,
      FROM_STOCK,
      PRODUCT_ID,
    );
    const toQty = await repos.stockMovementRepository.getBalanceQuantity(
      ORGANIZATION_ID,
      TO_STOCK,
      PRODUCT_ID,
    );
    expect(fromQty).toBe('7');
    expect(toQty).toBe('3');
  });

  it('bloqueia from = to', async () => {
    const repos = setup();
    await seed(repos);

    await expect(
      repos.useCase.execute({
        organizationId: ORGANIZATION_ID,
        fromStockId: FROM_STOCK,
        toStockId: FROM_STOCK,
        operatedAt: new Date(),
        responsibleName: 'Operador',
        createdByUserId: USER_ID,
        lines: [{ productId: PRODUCT_ID, quantity: '1' }],
      }),
    ).rejects.toBeInstanceOf(StockTransferSameStockError);
  });

  it('permite transferência com saldo insuficiente e deixa origem negativa', async () => {
    const repos = setup();
    await seed(repos);

    const transfer = await repos.useCase.execute({
      organizationId: ORGANIZATION_ID,
      fromStockId: FROM_STOCK,
      toStockId: TO_STOCK,
      operatedAt: new Date(),
      responsibleName: 'Operador',
      createdByUserId: USER_ID,
      lines: [{ productId: PRODUCT_ID, quantity: '99' }],
    });

    expect(transfer.status).toBe('active');

    const fromQty = await repos.stockMovementRepository.getBalanceQuantity(
      ORGANIZATION_ID,
      FROM_STOCK,
      PRODUCT_ID,
    );
    const toQty = await repos.stockMovementRepository.getBalanceQuantity(
      ORGANIZATION_ID,
      TO_STOCK,
      PRODUCT_ID,
    );
    expect(fromQty).toBe('-89');
    expect(toQty).toBe('99');
  });

  it('bloqueia carrierId inexistente', async () => {
    const repos = setup();
    await seed(repos);

    await expect(
      repos.useCase.execute({
        organizationId: ORGANIZATION_ID,
        fromStockId: FROM_STOCK,
        toStockId: TO_STOCK,
        operatedAt: new Date(),
        carrierId: MISSING_CARRIER,
        responsibleName: 'Operador',
        createdByUserId: USER_ID,
        lines: [{ productId: PRODUCT_ID, quantity: '1' }],
      }),
    ).rejects.toBeInstanceOf(CarrierNotFoundError);
  });
});
