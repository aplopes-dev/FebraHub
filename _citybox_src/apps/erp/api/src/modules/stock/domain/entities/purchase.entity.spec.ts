import { Purchase } from './purchase.entity';
import { ORGANIZATION_ID } from '../../../tenancy/tests/tenancy-test-factory';

const STOCK_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const SUPPLIER_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const PRODUCT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const PRODUCT_B = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

type LineInput = {
  productId: string;
  quantity: string;
  costCents: number;
  status?: 'pending' | 'received' | 'cancelled';
};

function makePurchase(lines: LineInput[], extras: Partial<{
  freightCents: number;
  discountsCents: number;
  otherExpensesCents: number;
  deliveryStatus: 'pending' | 'received';
}> = {}) {
  return Purchase.create({
    organizationId: ORGANIZATION_ID,
    stockId: STOCK_ID,
    supplierId: SUPPLIER_ID,
    purchasedAt: new Date('2026-08-16T00:00:00.000Z'),
    lines: lines.map((line) => ({ status: 'pending' as const, ...line })),
    ...extras,
  });
}

describe('Purchase — total do documento', () => {
  it('soma quantidade × custo das linhas', () => {
    const purchase = makePurchase([
      { productId: PRODUCT_A, quantity: '10', costCents: 500 },
      { productId: PRODUCT_B, quantity: '2', costCents: 1000 },
    ]);

    expect(purchase.linesTotalCents).toBe(7000);
    expect(purchase.totalCents).toBe(7000);
  });

  it('aplica frete, outras despesas e descontos', () => {
    const purchase = makePurchase(
      [{ productId: PRODUCT_A, quantity: '10', costCents: 500 }],
      { freightCents: 1000, otherExpensesCents: 500, discountsCents: 200 },
    );

    expect(purchase.totalCents).toBe(5000 + 1000 + 500 - 200);
  });

  describe('linha cancelada não é cobrada (FIN-1)', () => {
    // O diálogo de recebimento permite marcar um item como cancelado — ele
    // não foi recebido e o fornecedor não o cobra. O frontend já excluía;
    // o domínio somava tudo, e os dois totais divergiam na tela.

    it('exclui a linha cancelada do total', () => {
      const purchase = makePurchase([
        { productId: PRODUCT_A, quantity: '10', costCents: 500, status: 'received' },
        { productId: PRODUCT_B, quantity: '4', costCents: 250, status: 'cancelled' },
      ]);

      expect(purchase.linesTotalCents).toBe(5000);
    });

    it('linha pending continua contando — foi pedida, só não chegou', () => {
      const purchase = makePurchase([
        { productId: PRODUCT_A, quantity: '10', costCents: 500, status: 'received' },
        { productId: PRODUCT_B, quantity: '4', costCents: 250, status: 'pending' },
      ]);

      expect(purchase.linesTotalCents).toBe(6000);
    });

    it('todas canceladas → só frete e despesas restam', () => {
      const purchase = makePurchase(
        [{ productId: PRODUCT_A, quantity: '10', costCents: 500, status: 'cancelled' }],
        { freightCents: 800 },
      );

      expect(purchase.linesTotalCents).toBe(0);
      expect(purchase.totalCents).toBe(800);
    });

    it('receivedLines segue considerando só as recebidas', () => {
      const purchase = makePurchase([
        { productId: PRODUCT_A, quantity: '10', costCents: 500, status: 'received' },
        { productId: PRODUCT_B, quantity: '4', costCents: 250, status: 'cancelled' },
      ]);

      expect(purchase.receivedLines).toHaveLength(1);
      expect(purchase.receivedLines[0].productId).toBe(PRODUCT_A);
    });
  });

  describe('recebimento é all-or-nothing (LED-5)', () => {
    it('rejeita compra recebida com linha pendente', () => {
      expect(() =>
        makePurchase(
          [
            { productId: PRODUCT_A, quantity: '10', costCents: 500, status: 'received' },
            { productId: PRODUCT_B, quantity: '4', costCents: 250, status: 'pending' },
          ],
          { deliveryStatus: 'received' },
        ),
      ).toThrow(/pending line/);
    });

    it('aceita recebida quando toda linha é received ou cancelled', () => {
      const purchase = makePurchase(
        [
          { productId: PRODUCT_A, quantity: '10', costCents: 500, status: 'received' },
          { productId: PRODUCT_B, quantity: '4', costCents: 250, status: 'cancelled' },
        ],
        { deliveryStatus: 'received' },
      );

      expect(purchase.deliveryStatus).toBe('received');
      expect(purchase.receivedLines).toHaveLength(1);
    });

    it('compra pendente pode ter linha pendente normalmente', () => {
      const purchase = makePurchase([
        { productId: PRODUCT_A, quantity: '10', costCents: 500, status: 'pending' },
      ]);

      expect(purchase.deliveryStatus).toBe('pending');
    });
  });
});
