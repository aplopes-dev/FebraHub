import {
  generateUpfrontInvoices,
  generateManualInvoice,
} from './generate-upfront-invoices';

describe('generateUpfrontInvoices', () => {
  const baseParams = {
    subscriptionId: '9dccd404-e635-450f-8227-ac630403605e',
    storeId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    priceCents: 49900,
    dayOfMonth: 5,
  };

  describe('MONTHLY cycle', () => {
    it('should generate 12 invoices', () => {
      const referenceDate = new Date(2026, 6, 14); // July 14
      const invoices = generateUpfrontInvoices({
        ...baseParams,
        cycle: 'MONTHLY',
        referenceDate,
      });

      expect(invoices).toHaveLength(12);
    });

    it('should set correct due dates for each month', () => {
      const referenceDate = new Date(2026, 6, 14); // July 14
      const invoices = generateUpfrontInvoices({
        ...baseParams,
        cycle: 'MONTHLY',
        referenceDate,
      });

      // First invoice: August 5, 2026
      expect(invoices[0].dueDate.getFullYear()).toBe(2026);
      expect(invoices[0].dueDate.getMonth()).toBe(7); // August
      expect(invoices[0].dueDate.getDate()).toBe(5);

      // Second invoice: September 5, 2026
      expect(invoices[1].dueDate.getFullYear()).toBe(2026);
      expect(invoices[1].dueDate.getMonth()).toBe(8); // September
      expect(invoices[1].dueDate.getDate()).toBe(5);

      // Last invoice (12th): July 5, 2027
      expect(invoices[11].dueDate.getFullYear()).toBe(2027);
      expect(invoices[11].dueDate.getMonth()).toBe(6); // July
      expect(invoices[11].dueDate.getDate()).toBe(5);
    });

    it('should set correct periods (each period ends where next begins)', () => {
      const referenceDate = new Date(2026, 6, 14); // July 14
      const invoices = generateUpfrontInvoices({
        ...baseParams,
        cycle: 'MONTHLY',
        referenceDate,
      });

      // First invoice period
      expect(invoices[0].periodStart).toEqual(referenceDate);
      expect(invoices[0].periodEnd).toEqual(invoices[1].periodStart);

      // Second invoice period
      expect(invoices[1].periodEnd).toEqual(invoices[2].periodStart);

      // All periods are contiguous
      for (let i = 0; i < invoices.length - 1; i++) {
        expect(invoices[i].periodEnd).toEqual(invoices[i + 1].periodStart);
      }
    });

    it('should set all invoices as OPEN', () => {
      const referenceDate = new Date(2026, 6, 14);
      const invoices = generateUpfrontInvoices({
        ...baseParams,
        cycle: 'MONTHLY',
        referenceDate,
      });

      for (const invoice of invoices) {
        expect(invoice.status).toBe('OPEN');
      }
    });

    it('should set correct amount for all invoices', () => {
      const referenceDate = new Date(2026, 6, 14);
      const invoices = generateUpfrontInvoices({
        ...baseParams,
        cycle: 'MONTHLY',
        referenceDate,
      });

      for (const invoice of invoices) {
        expect(invoice.amountCents).toBe(49900);
        expect(invoice.currency).toBe('BRL');
      }
    });

    it('should set correct subscriptionId and storeId', () => {
      const referenceDate = new Date(2026, 6, 14);
      const invoices = generateUpfrontInvoices({
        ...baseParams,
        cycle: 'MONTHLY',
        referenceDate,
      });

      for (const invoice of invoices) {
        expect(invoice.subscriptionId).toBe(
          '9dccd404-e635-450f-8227-ac630403605e',
        );
        expect(invoice.storeId).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
      }
    });

    it('should clamp dayOfMonth to last day of month', () => {
      const referenceDate = new Date(2026, 0, 15); // January 15
      const invoices = generateUpfrontInvoices({
        ...baseParams,
        cycle: 'MONTHLY',
        dayOfMonth: 31,
        referenceDate,
      });

      // First invoice: February 28, 2026 (clamped from 31)
      expect(invoices[0].dueDate.getMonth()).toBe(1); // February
      expect(invoices[0].dueDate.getDate()).toBe(28);

      // March 31, 2026 (March has 31 days)
      expect(invoices[1].dueDate.getMonth()).toBe(2); // March
      expect(invoices[1].dueDate.getDate()).toBe(31);
    });

    it('should handle day 1', () => {
      const referenceDate = new Date(2026, 6, 14);
      const invoices = generateUpfrontInvoices({
        ...baseParams,
        cycle: 'MONTHLY',
        dayOfMonth: 1,
        referenceDate,
      });

      expect(invoices[0].dueDate.getDate()).toBe(1);
      expect(invoices[0].dueDate.getMonth()).toBe(7); // August
    });
  });

  describe('YEARLY cycle', () => {
    it('should generate 1 invoice', () => {
      const referenceDate = new Date(2026, 6, 14); // July 14
      const invoices = generateUpfrontInvoices({
        ...baseParams,
        cycle: 'YEARLY',
        referenceDate,
      });

      expect(invoices).toHaveLength(1);
    });

    it('should set due date to next month (not next year)', () => {
      const referenceDate = new Date(2026, 6, 14); // July 14
      const invoices = generateUpfrontInvoices({
        ...baseParams,
        cycle: 'YEARLY',
        referenceDate,
      });

      // Due date should be August 5, 2026 (next month)
      expect(invoices[0].dueDate.getFullYear()).toBe(2026);
      expect(invoices[0].dueDate.getMonth()).toBe(7); // August
      expect(invoices[0].dueDate.getDate()).toBe(5);
    });

    it('should set period of 1 year (periodEnd = referenceDate + 1 year)', () => {
      const referenceDate = new Date(2026, 6, 14); // July 14
      const invoices = generateUpfrontInvoices({
        ...baseParams,
        cycle: 'YEARLY',
        referenceDate,
      });

      expect(invoices[0].periodStart).toEqual(referenceDate);
      // Period end should be July 14, 2027 (1 year later)
      expect(invoices[0].periodEnd.getFullYear()).toBe(2027);
      expect(invoices[0].periodEnd.getMonth()).toBe(6); // July
      expect(invoices[0].periodEnd.getDate()).toBe(14);
    });

    it('should set status as OPEN', () => {
      const referenceDate = new Date(2026, 6, 14);
      const invoices = generateUpfrontInvoices({
        ...baseParams,
        cycle: 'YEARLY',
        referenceDate,
      });

      expect(invoices[0].status).toBe('OPEN');
    });

    it('should clamp dayOfMonth for yearly due date', () => {
      const referenceDate = new Date(2026, 0, 15); // January 15
      const invoices = generateUpfrontInvoices({
        ...baseParams,
        cycle: 'YEARLY',
        dayOfMonth: 31,
        referenceDate,
      });

      // Due date: February 28, 2026 (clamped from 31)
      expect(invoices[0].dueDate.getFullYear()).toBe(2026);
      expect(invoices[0].dueDate.getMonth()).toBe(1); // February
      expect(invoices[0].dueDate.getDate()).toBe(28);
    });
  });

  describe('generateManualInvoice', () => {
    it('should generate a single manual invoice', () => {
      const referenceDate = new Date(2026, 6, 14); // July 14
      const periodStart = new Date(2026, 6, 1);
      const periodEnd = new Date(2026, 6, 31);
      const invoice = generateManualInvoice({
        subscriptionId: baseParams.subscriptionId,
        storeId: baseParams.storeId,
        amountCents: baseParams.priceCents,
        dayOfMonth: baseParams.dayOfMonth,
        periodStart,
        periodEnd,
        referenceDate,
      });

      expect(invoice.subscriptionId).toBe(
        '9dccd404-e635-450f-8227-ac630403605e',
      );
      expect(invoice.storeId).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
      expect(invoice.amountCents).toBe(49900);
      expect(invoice.currency).toBe('BRL');
      expect(invoice.status).toBe('OPEN');
      expect(invoice.periodStart).toEqual(periodStart);
      expect(invoice.periodEnd).toEqual(periodEnd);
      // Vencimento deve ser no próximo mês, ou seja, August 5, 2026
      expect(invoice.dueDate.getFullYear()).toBe(2026);
      expect(invoice.dueDate.getMonth()).toBe(7); // August
      expect(invoice.dueDate.getDate()).toBe(5);
    });
  });
});
