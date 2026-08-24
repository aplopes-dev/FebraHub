import { Invoice } from './invoice.entity';
import { InvalidInvoiceStateTransitionError } from '../errors/invalid-invoice-state-transition.error';

describe('Invoice Entity', () => {
  const defaultProps = {
    subscriptionId: '11111111-1111-4111-a111-111111111111',
    storeId: '22222222-2222-4222-b222-222222222222',
    amountCents: 9900,
    currency: 'BRL',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    periodStart: new Date(),
    periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  };

  it('should create an invoice in DRAFT status by default', () => {
    const invoice = Invoice.create(defaultProps);
    expect(invoice.status).toBe('DRAFT');
    expect(invoice.currency).toBe('BRL');
  });

  it('should support optional notes field', () => {
    const invoice = Invoice.create({ ...defaultProps, notes: 'Some notes' });
    expect(invoice.notes).toBe('Some notes');
  });

  it('should transition from DRAFT to OPEN on publish', () => {
    const invoice = Invoice.create(defaultProps);
    invoice.publish();
    expect(invoice.status).toBe('OPEN');
  });

  it('should not allow publishing if not in DRAFT status', () => {
    const invoice = Invoice.create({ ...defaultProps, status: 'OPEN' });
    expect(() => invoice.publish()).toThrow(InvalidInvoiceStateTransitionError);
  });

  it('should transition from OPEN to PAID on markPaid', () => {
    const invoice = Invoice.create({ ...defaultProps, status: 'OPEN' });
    invoice.markPaid('PIX');
    expect(invoice.status).toBe('PAID');
    expect(invoice.method).toBe('PIX');
    expect(invoice.paidAt).toBeInstanceOf(Date);
  });

  it('should transition from PAST_DUE to PAID on markPaid', () => {
    const invoice = Invoice.create({ ...defaultProps, status: 'PAST_DUE' });
    invoice.markPaid('BOLETO');
    expect(invoice.status).toBe('PAID');
    expect(invoice.method).toBe('BOLETO');
  });

  it('should not allow markPaid if not OPEN or PAST_DUE', () => {
    const invoice = Invoice.create(defaultProps); // DRAFT
    expect(() => invoice.markPaid('MANUAL')).toThrow(
      InvalidInvoiceStateTransitionError,
    );
  });

  it('should transition to PAST_DUE on markPastDue', () => {
    const invoice = Invoice.create({ ...defaultProps, status: 'OPEN' });
    invoice.markPastDue();
    expect(invoice.status).toBe('PAST_DUE');
  });

  it('should transition to VOID from DRAFT, OPEN or PAST_DUE', () => {
    const draft = Invoice.create(defaultProps);
    draft.void();
    expect(draft.status).toBe('VOID');

    const open = Invoice.create({ ...defaultProps, status: 'OPEN' });
    open.void();
    expect(open.status).toBe('VOID');

    const pastDue = Invoice.create({ ...defaultProps, status: 'PAST_DUE' });
    pastDue.void();
    expect(pastDue.status).toBe('VOID');
  });

  it('should check if invoice is past due lazily', () => {
    const pastDueDate = new Date(Date.now() - 1000);
    const invoice = Invoice.create({
      ...defaultProps,
      status: 'OPEN',
      dueDate: pastDueDate,
    });
    const changed = invoice.checkPastDue();
    expect(changed).toBe(true);
    expect(invoice.status).toBe('PAST_DUE');
  });

  it('should not mark past due if dueDate is in the future', () => {
    const futureDueDate = new Date(Date.now() + 100000);
    const invoice = Invoice.create({
      ...defaultProps,
      status: 'OPEN',
      dueDate: futureDueDate,
    });
    const changed = invoice.checkPastDue();
    expect(changed).toBe(false);
    expect(invoice.status).toBe('OPEN');
  });
});
