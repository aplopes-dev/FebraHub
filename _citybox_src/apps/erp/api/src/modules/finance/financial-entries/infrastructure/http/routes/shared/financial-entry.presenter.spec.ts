import { FinancialEntry } from '../../../../domain/entities/financial-entry.entity';
import { FinancialEntryPresenter } from './financial-entry.presenter';

const ORGANIZATION_ID = '11111111-1111-4111-8111-111111111111';
const ENTRY_ID = 'e1111111-1111-4111-8111-111111111111';
const SALE_ORDER_ID = 'a1111111-1111-4111-8111-111111111111';
const SALE_ORDER_PAYMENT_ID = 'b1111111-1111-4111-8111-111111111111';
const CARD_CONTRACT_ID = 'c1111111-1111-4111-8111-111111111111';
const CARD_PAYMENT_METHOD_ID = 'd1111111-1111-4111-8111-111111111111';

function makeCardSettlementEntry(): FinancialEntry {
  const now = new Date('2026-08-01T00:00:00.000Z');
  return FinancialEntry.with(
    {
      organizationId: ORGANIZATION_ID,
      operation: 'receivable',
      description: 'Pedido de venda #1',
      amountCents: 9770,
      feesCents: 0,
      finesCents: 0,
      paidCents: 0,
      status: 'pending',
      competenceDate: now,
      dueDate: now,
      partyName: 'Cliente Teste',
      customerId: null,
      supplierId: null,
      bankAccountId: null,
      saleOrderId: SALE_ORDER_ID,
      categoryName: 'Venda',
      note: '',
      grossAmountCents: 10000,
      acquirerFeeCents: 230,
      cardContractId: CARD_CONTRACT_ID,
      cardPaymentMethodId: CARD_PAYMENT_METHOD_ID,
      saleOrderPaymentId: SALE_ORDER_PAYMENT_ID,
      installmentSequence: 1,
      installmentCount: 1,
      cardSettlementFallback: false,
      payments: [],
      allocations: [],
      attachments: [],
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    },
    ENTRY_ID,
  );
}

describe('FinancialEntryPresenter — motor de recebíveis (US5)', () => {
  it('toHttp expõe bruto/taxa/parcela/aviso de fallback no detalhe', () => {
    const http = FinancialEntryPresenter.toHttp(makeCardSettlementEntry());

    expect(http.grossAmountCents).toBe(10000);
    expect(http.acquirerFeeCents).toBe(230);
    expect(http.cardContractId).toBe(CARD_CONTRACT_ID);
    expect(http.cardPaymentMethodId).toBe(CARD_PAYMENT_METHOD_ID);
    expect(http.saleOrderPaymentId).toBe(SALE_ORDER_PAYMENT_ID);
    expect(http.installmentSequence).toBe(1);
    expect(http.installmentCount).toBe(1);
    expect(http.cardSettlementFallback).toBe(false);
  });

  it('toHttpListItem expõe bruto/taxa/parcela/aviso, sem os ids de FK', () => {
    const item = FinancialEntryPresenter.toHttpListItem(
      makeCardSettlementEntry(),
      null,
    );

    expect(item.grossAmountCents).toBe(10000);
    expect(item.acquirerFeeCents).toBe(230);
    expect(item.installmentSequence).toBe(1);
    expect(item.installmentCount).toBe(1);
    expect(item.cardSettlementFallback).toBe(false);
    expect('cardContractId' in item).toBe(false);
    expect('saleOrderPaymentId' in item).toBe(false);
  });

  it('lançamento manual (fora do motor) expõe os campos novos como null/false', () => {
    const now = new Date('2026-08-01T00:00:00.000Z');
    const manualEntry = FinancialEntry.create({
      organizationId: ORGANIZATION_ID,
      operation: 'receivable',
      amountCents: 5000,
      competenceDate: now,
      dueDate: now,
      allocations: [
        {
          chartOfAccountId: 'a0000000-0000-4000-8000-000000000000',
          costCenterId: 'f0000000-0000-4000-8000-000000000000',
          amountCents: 5000,
          percentage: 100,
        },
      ],
    });

    const http = FinancialEntryPresenter.toHttp(manualEntry);

    expect(http.grossAmountCents).toBeNull();
    expect(http.acquirerFeeCents).toBeNull();
    expect(http.cardContractId).toBeNull();
    expect(http.saleOrderPaymentId).toBeNull();
    expect(http.cardSettlementFallback).toBe(false);
  });
});
