import { describe, expect, it } from 'vitest';
import {
  buildCashFlowPdfFileName,
  cashFlowEntryDisplayName,
  cashFlowEntryStatusLabel,
  formatCashFlowPdfPeriodLabel,
} from './build-cash-flow-pdf';
import type { FinancialEntry } from '../types';

function entry(partial: Partial<FinancialEntry>): FinancialEntry {
  return {
    id: '1',
    type: 'income',
    status: 'pending',
    origin: 'manual',
    description: 'Consulta',
    value: 100,
    dueDate: '2026-08-05',
    paidAt: null,
    paidValue: null,
    paymentMethod: null,
    paymentType: null,
    observation: null,
    hasReceipt: false,
    receiptUrl: null,
    isOverdue: false,
    installmentNumber: null,
    totalInstallments: null,
    recurrenceGroupId: null,
    categoryId: null,
    category: null,
    incomeCategoryId: null,
    incomeCategory: null,
    account: null,
    patientId: null,
    patient: null,
    budgetId: null,
    checkDate: null,
    checkName: null,
    checkNumber: null,
    checkBank: null,
    checkCpfCnpj: null,
    createdAt: '2026-08-05',
    ...partial,
  };
}

describe('cashFlowEntryStatusLabel', () => {
  it('prioriza vencido', () => {
    expect(
      cashFlowEntryStatusLabel(entry({ isOverdue: true, status: 'pending' })),
    ).toBe('Vencido');
  });

  it('mapeia status recebidos', () => {
    expect(cashFlowEntryStatusLabel(entry({ status: 'received' }))).toBe(
      'Recebido',
    );
    expect(cashFlowEntryStatusLabel(entry({ status: 'paid' }))).toBe('Pago');
    expect(cashFlowEntryStatusLabel(entry({ status: 'cancelled' }))).toBe(
      'Cancelado',
    );
    expect(cashFlowEntryStatusLabel(entry({ status: 'pending' }))).toBe(
      'Pendente',
    );
  });
});

describe('cashFlowEntryDisplayName', () => {
  it('usa nome do paciente quando existe', () => {
    expect(
      cashFlowEntryDisplayName(
        entry({
          patient: { id: 'p1', name: 'Maria Silva', cpf: null },
          description: 'Orçamento',
        }),
      ),
    ).toBe('Maria Silva');
  });

  it('cai na descrição sem paciente', () => {
    expect(cashFlowEntryDisplayName(entry({ description: 'Aluguel' }))).toBe(
      'Aluguel',
    );
  });
});

describe('buildCashFlowPdfFileName', () => {
  it('gera nome com prefixo fluxo-de-caixa', () => {
    const name = buildCashFlowPdfFileName(new Date(2026, 7, 5));
    expect(name).toMatch(/^fluxo-de-caixa-\d{4}-\d{2}-\d{2}\.pdf$/);
    expect(name).toBe('fluxo-de-caixa-2026-08-05.pdf');
  });
});

describe('formatCashFlowPdfPeriodLabel', () => {
  it('uses MM/yyyy when the range is a full calendar month', () => {
    expect(formatCashFlowPdfPeriodLabel('2026-08-01', '2026-08-31')).toBe('08/2026');
  });

  it('uses dd/MM/yyyy when start and end are the same day', () => {
    expect(formatCashFlowPdfPeriodLabel('2026-08-18', '2026-08-18')).toBe(
      '18/08/2026',
    );
  });

  it('uses a date range for partial months and rolling windows', () => {
    expect(formatCashFlowPdfPeriodLabel('2026-07-19', '2026-08-18')).toBe(
      '19/07/2026 a 18/08/2026',
    );
  });
});
