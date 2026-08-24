import { calculateCardSettlement } from './card-settlement-calculator';
import { CardSettlementRateUnresolvedError } from '../errors/card-settlement-rate-unresolved.error';

// 2026-02-06 = sexta-feira · 2026-02-07 = sábado · 2026-02-09 = segunda-feira
const FRIDAY = new Date(2026, 1, 6);
const MONDAY = new Date(2026, 1, 9);

function isSameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

describe('calculateCardSettlement', () => {
  it('débito Visa 2,3% D+1 corrido: R$100,00 → R$97,70 vencendo no dia seguinte', () => {
    const result = calculateCardSettlement({
      grossAmountCents: 10000,
      saleDate: FRIDAY,
      installments: 1,
      method: {
        rate: '2.3',
        feeCents: null,
        firstPaymentDays: 1,
        daysBetweenInstallments: null,
        progressiveEnabled: false,
        rateTiers: [],
      },
      contract: {
        firstPaymentDayType: 'calendar_days',
        installmentDayType: 'calendar_days',
        businessDaysOnly: false,
      },
    });

    expect(result).toHaveLength(1);
    expect(result[0].sequence).toBe(1);
    expect(result[0].grossAmountCents).toBe(10000);
    expect(result[0].feeAmountCents).toBe(230);
    expect(result[0].netAmountCents).toBe(9770);
    expect(isSameDate(result[0].dueDate, new Date(2026, 1, 7))).toBe(true); // sábado — corrido, sem push
  });

  it('débito Mastercard 2,0% D+1 útil, vendido numa sexta: vence na segunda (não no sábado)', () => {
    const result = calculateCardSettlement({
      grossAmountCents: 10000,
      saleDate: FRIDAY,
      installments: 1,
      method: {
        rate: '2.0',
        feeCents: null,
        firstPaymentDays: 1,
        daysBetweenInstallments: null,
        progressiveEnabled: false,
        rateTiers: [],
      },
      contract: {
        firstPaymentDayType: 'business_days',
        installmentDayType: 'business_days',
        businessDaysOnly: false,
      },
    });

    expect(result).toHaveLength(1);
    expect(result[0].feeAmountCents).toBe(200);
    expect(result[0].netAmountCents).toBe(9800);
    expect(isSameDate(result[0].dueDate, MONDAY)).toBe(true);
  });

  it('Pix com taxa 0 e prazo 0: valor cheio, vencendo no mesmo dia', () => {
    const result = calculateCardSettlement({
      grossAmountCents: 5000,
      saleDate: FRIDAY,
      installments: 1,
      method: {
        rate: '0',
        feeCents: null,
        firstPaymentDays: 0,
        daysBetweenInstallments: null,
        progressiveEnabled: false,
        rateTiers: [],
      },
      contract: {
        firstPaymentDayType: 'calendar_days',
        installmentDayType: 'calendar_days',
        businessDaysOnly: false,
      },
    });

    expect(result).toHaveLength(1);
    expect(result[0].feeAmountCents).toBe(0);
    expect(result[0].netAmountCents).toBe(5000);
    expect(isSameDate(result[0].dueDate, FRIDAY)).toBe(true);
  });

  it('desconta a tarifa fixa além da taxa percentual', () => {
    const result = calculateCardSettlement({
      grossAmountCents: 10000,
      saleDate: FRIDAY,
      installments: 1,
      method: {
        rate: '2.3',
        feeCents: 50,
        firstPaymentDays: 1,
        daysBetweenInstallments: null,
        progressiveEnabled: false,
        rateTiers: [],
      },
      contract: {
        firstPaymentDayType: 'calendar_days',
        installmentDayType: 'calendar_days',
        businessDaysOnly: false,
      },
    });

    // 2,3% de 10000 = 230 + 50 de tarifa fixa = 280
    expect(result[0].feeAmountCents).toBe(280);
    expect(result[0].netAmountCents).toBe(9720);
  });

  it('faixa progressiva: 5 parcelas cai na faixa 4-6x, não na 1-3x nem na taxa base', () => {
    const result = calculateCardSettlement({
      grossAmountCents: 100000,
      saleDate: FRIDAY,
      installments: 5,
      method: {
        rate: '10',
        feeCents: null,
        firstPaymentDays: 30,
        daysBetweenInstallments: 30,
        progressiveEnabled: true,
        rateTiers: [
          { minInstallments: 1, maxInstallments: 3, rate: '3' },
          { minInstallments: 4, maxInstallments: 6, rate: '4' },
        ],
      },
      contract: {
        firstPaymentDayType: 'calendar_days',
        installmentDayType: 'single_payment',
        businessDaysOnly: false,
      },
    });

    // 4% de 100000 = 4000 (não 3000 da faixa 1-3x, nem 10000 da taxa base 10%)
    expect(result[0].feeAmountCents).toBe(4000);
    expect(result[0].netAmountCents).toBe(96000);
  });

  it('crédito 6x com installmentDayType=single_payment: 1 única parcela com o líquido total (US3)', () => {
    const result = calculateCardSettlement({
      grossAmountCents: 60000,
      saleDate: FRIDAY,
      installments: 6,
      method: {
        rate: '5',
        feeCents: null,
        firstPaymentDays: 30,
        daysBetweenInstallments: 30,
        progressiveEnabled: false,
        rateTiers: [],
      },
      contract: {
        firstPaymentDayType: 'calendar_days',
        installmentDayType: 'single_payment',
        businessDaysOnly: false,
      },
    });

    expect(result).toHaveLength(1);
    expect(result[0].sequence).toBe(1);
    expect(result[0].grossAmountCents).toBe(60000);
    expect(result[0].feeAmountCents).toBe(3000); // 5% de 60000
    expect(result[0].netAmountCents).toBe(57000);
  });

  it('crédito 6x em dias corridos: 6 parcelas espaçadas, soma exata (sem centavo perdido) — US3', () => {
    const result = calculateCardSettlement({
      grossAmountCents: 60000, // não divisível por 6 sem resto após a taxa
      saleDate: FRIDAY,
      installments: 6,
      method: {
        rate: '3.33', // gera fração de centavo na taxa
        feeCents: null,
        firstPaymentDays: 30,
        daysBetweenInstallments: 30,
        progressiveEnabled: false,
        rateTiers: [],
      },
      contract: {
        firstPaymentDayType: 'calendar_days',
        installmentDayType: 'calendar_days',
        businessDaysOnly: false,
      },
    });

    expect(result).toHaveLength(6);
    result.forEach((installment, index) => {
      expect(installment.sequence).toBe(index + 1);
      expect(installment.netAmountCents).toBe(
        installment.grossAmountCents - installment.feeAmountCents,
      );
    });

    // Datas espaçadas por 30 dias corridos a partir da 1ª parcela.
    for (let i = 1; i < result.length; i += 1) {
      const expectedDate = new Date(result[i - 1].dueDate);
      expectedDate.setDate(expectedDate.getDate() + 30);
      expect(result[i].dueDate.toDateString()).toBe(
        expectedDate.toDateString(),
      );
    }

    const totalGross = result.reduce((sum, i) => sum + i.grossAmountCents, 0);
    const totalFee = result.reduce((sum, i) => sum + i.feeAmountCents, 0);
    const totalNet = result.reduce((sum, i) => sum + i.netAmountCents, 0);

    const expectedTotalFee = Math.round(60000 * (3.33 / 100));
    expect(totalGross).toBe(60000);
    expect(totalFee).toBe(expectedTotalFee);
    expect(totalNet).toBe(60000 - expectedTotalFee);

    // O resto da divisão (bruto e taxa) cai inteiro na última parcela —
    // convenção de `sales-contracts.service.ts` (research.md D8).
    const baseGross = Math.floor(60000 / 6);
    expect(result[5].grossAmountCents).toBe(
      baseGross + (60000 - baseGross * 6),
    );
  });

  it('lança CardSettlementRateUnresolvedError quando não há faixa nem taxa base', () => {
    expect(() =>
      calculateCardSettlement({
        grossAmountCents: 10000,
        saleDate: FRIDAY,
        installments: 5,
        method: {
          rate: null,
          feeCents: null,
          firstPaymentDays: 30,
          daysBetweenInstallments: 30,
          progressiveEnabled: true,
          rateTiers: [{ minInstallments: 1, maxInstallments: 3, rate: '3' }],
        },
        contract: {
          firstPaymentDayType: 'calendar_days',
          installmentDayType: 'single_payment',
          businessDaysOnly: false,
        },
      }),
    ).toThrow(CardSettlementRateUnresolvedError);
  });

  it('lança erro de validação para número de parcelas inválido', () => {
    expect(() =>
      calculateCardSettlement({
        grossAmountCents: 10000,
        saleDate: FRIDAY,
        installments: 0,
        method: {
          rate: '2.3',
          feeCents: null,
          firstPaymentDays: 1,
          daysBetweenInstallments: null,
          progressiveEnabled: false,
          rateTiers: [],
        },
        contract: {
          firstPaymentDayType: 'calendar_days',
          installmentDayType: 'calendar_days',
          businessDaysOnly: false,
        },
      }),
    ).toThrow();
  });
});
