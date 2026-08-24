import { BadRequestException } from '@nestjs/common';
import { FinancialEntry } from '../../../../financial/entries/domain/entities/financial-entry.entity';
import { InMemoryFinancialEntryRepository } from '../../../../financial/entries/tests/in-memory-financial-entry.repository';
import { GetDashboardPaymentMethodsUseCase } from './get-dashboard-payment-methods.use-case';

const storeId = '11111111-1111-1111-1111-111111111111';
const otherStoreId = '22222222-2222-2222-2222-222222222222';
const IDS = {
  e1: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
  e2: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2',
  e3: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee3',
  e4: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee4',
  e5: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee5',
  e6: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee6',
} as const;

describe('GetDashboardPaymentMethodsUseCase', () => {
  function createUseCase() {
    const repo = new InMemoryFinancialEntryRepository();
    return {
      repo,
      useCase: new GetDashboardPaymentMethodsUseCase(repo),
    };
  }

  function income(input: {
    id: string;
    storeId?: string;
    status?: 'pending' | 'received' | 'cancelled';
    paidAt: Date | null;
    valueCents: number;
    paidValueCents?: number | null;
    paymentMethod?: string | null;
  }): FinancialEntry {
    return FinancialEntry.create(
      {
        storeId: input.storeId ?? storeId,
        type: 'income',
        status: input.status ?? 'received',
        source: 'manual',
        description: 'Recebimento teste',
        valueCents: input.valueCents,
        dueDate: input.paidAt ?? new Date('2026-07-01T00:00:00.000Z'),
        paidAt: input.paidAt,
        paidValueCents: input.paidValueCents ?? null,
        paymentMethod: input.paymentMethod ?? null,
      },
      input.id,
    );
  }

  it('requires startDate and endDate', async () => {
    const { useCase } = createUseCase();
    await expect(
      useCase.execute({
        storeId,
        startDate: '',
        endDate: '2026-07-31',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects inverted date range', async () => {
    const { useCase } = createUseCase();
    await expect(
      useCase.execute({
        storeId,
        startDate: '2026-07-31',
        endDate: '2026-07-01',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('aggregates received income by payment method with zeros for empty methods', async () => {
    const { repo, useCase } = createUseCase();
    repo.seed([
      income({
        id: IDS.e1,
        paidAt: new Date('2026-07-10T00:00:00.000Z'),
        valueCents: 10000,
        paidValueCents: 10000,
        paymentMethod: 'pix',
      }),
      income({
        id: IDS.e2,
        paidAt: new Date('2026-07-12T00:00:00.000Z'),
        valueCents: 5000,
        paidValueCents: 5000,
        paymentMethod: 'cash',
      }),
      income({
        id: IDS.e3,
        paidAt: new Date('2026-07-15T00:00:00.000Z'),
        valueCents: 3000,
        paidValueCents: 3000,
        paymentMethod: 'pix',
      }),
      income({
        id: IDS.e4,
        status: 'pending',
        paidAt: null,
        valueCents: 9999,
        paymentMethod: 'credit',
      }),
      income({
        id: IDS.e5,
        paidAt: new Date('2026-07-20T00:00:00.000Z'),
        valueCents: 2000,
        paidValueCents: 2000,
        paymentMethod: null,
      }),
      income({
        id: IDS.e6,
        paidAt: new Date('2026-07-18T00:00:00.000Z'),
        valueCents: 4000,
        paidValueCents: 4000,
        paymentMethod: 'crypto',
      }),
    ]);

    const result = await useCase.execute({
      storeId,
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    });

    expect(result.totalCents).toBe(18000);
    expect(result.items).toHaveLength(7);
    expect(result.items.map((item) => item.method)).toEqual([
      'cash',
      'credit',
      'debit',
      'pix',
      'transfer',
      'boleto',
      'check',
    ]);
    expect(
      result.items.find((item) => item.method === 'cash')?.amountCents,
    ).toBe(5000);
    expect(
      result.items.find((item) => item.method === 'pix')?.amountCents,
    ).toBe(13000);
    expect(
      result.items.find((item) => item.method === 'credit')?.amountCents,
    ).toBe(0);
  });

  it('uses paidValueCents when present and isolates store', async () => {
    const { repo, useCase } = createUseCase();
    repo.seed([
      income({
        id: IDS.e1,
        paidAt: new Date('2026-07-10T00:00:00.000Z'),
        valueCents: 10000,
        paidValueCents: 7500,
        paymentMethod: 'credit',
      }),
      income({
        id: IDS.e2,
        storeId: otherStoreId,
        paidAt: new Date('2026-07-10T00:00:00.000Z'),
        valueCents: 50000,
        paidValueCents: 50000,
        paymentMethod: 'credit',
      }),
      income({
        id: IDS.e3,
        paidAt: new Date('2026-06-30T00:00:00.000Z'),
        valueCents: 1000,
        paidValueCents: 1000,
        paymentMethod: 'debit',
      }),
    ]);

    const result = await useCase.execute({
      storeId,
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    });

    expect(result.totalCents).toBe(7500);
    expect(
      result.items.find((item) => item.method === 'credit')?.amountCents,
    ).toBe(7500);
    expect(
      result.items.find((item) => item.method === 'debit')?.amountCents,
    ).toBe(0);
  });
});
