import { createPassThroughUnitOfWork } from '../../../../../shared/core/tests/pass-through-unit-of-work';
import { MarkInvoiceAsPaidUseCase } from './mark-invoice-as-paid.use-case';
import { InMemoryInvoiceRepository } from '../../../tests/in-memory-invoice.repository';
import { Invoice } from '../../../domain/entities/invoice.entity';
import { InvoiceNotFoundError } from '../../../domain/errors/invoice-not-found.error';
import type { UnblockStoreUseCase } from '../../../../stores/application/use-cases/unblock-store/unblock-store.use-case';

describe('MarkInvoiceAsPaidUseCase', () => {
  let useCase: MarkInvoiceAsPaidUseCase;
  let invoiceRepository: InMemoryInvoiceRepository;

  beforeEach(() => {
    invoiceRepository = new InMemoryInvoiceRepository();
    useCase = new MarkInvoiceAsPaidUseCase(
      invoiceRepository,
      createPassThroughUnitOfWork(),
    );
  });

  it('should mark invoice as paid manually', async () => {
    const invoice = Invoice.create({
      subscriptionId: '11111111-1111-4111-a111-111111111111',
      storeId: '22222222-2222-4222-b222-222222222222',
      amountCents: 1000,
      dueDate: new Date(),
      periodStart: new Date(),
      periodEnd: new Date(),
      status: 'OPEN',
    });
    await invoiceRepository.save(invoice);

    const result = await useCase.execute({
      invoiceId: invoice.id,
      method: 'PIX',
    });
    expect(result.status).toBe('PAID');
    expect(result.method).toBe('PIX');
    expect(result.paidAt).toBeInstanceOf(Date);

    const persisted = await invoiceRepository.findById(invoice.id);
    expect(persisted?.status).toBe('PAID');
  });

  it('should throw InvoiceNotFoundError if invoice does not exist', async () => {
    await expect(
      useCase.execute({
        invoiceId: '8bf6c407-e836-47b2-bdcf-8ea961a86895',
        method: 'PIX',
      }),
    ).rejects.toThrow(InvoiceNotFoundError);
  });

  it('reactivates a BLOCKED store when a past-due invoice is paid', async () => {
    const storeId = '77777777-7777-4777-9777-777777777777';
    const invoice = Invoice.create({
      subscriptionId: '11111111-1111-4111-a111-111111111111',
      storeId,
      amountCents: 1000,
      dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      periodStart: new Date(),
      periodEnd: new Date(),
      status: 'OPEN',
    });
    invoice.checkPastDue();
    await invoiceRepository.save(invoice);

    const unblockStoreExecute = jest.fn();
    const unblockStore = {
      execute: unblockStoreExecute,
    } as unknown as UnblockStoreUseCase;
    const useCaseWithUnblock = new MarkInvoiceAsPaidUseCase(
      invoiceRepository,
      createPassThroughUnitOfWork(),
      unblockStore,
    );

    await useCaseWithUnblock.execute({ invoiceId: invoice.id, method: 'PIX' });

    expect(unblockStoreExecute).toHaveBeenCalledWith({
      id: storeId,
      actor: 'system:billing',
    });
  });

  it('does not try to reactivate a store when the invoice was not past due', async () => {
    const storeId = '88888888-8888-4888-9888-888888888888';
    const invoice = Invoice.create({
      subscriptionId: '11111111-1111-4111-a111-111111111111',
      storeId,
      amountCents: 1000,
      dueDate: new Date(),
      periodStart: new Date(),
      periodEnd: new Date(),
      status: 'OPEN',
    });
    await invoiceRepository.save(invoice);

    const unblockStoreExecute = jest.fn();
    const unblockStore = {
      execute: unblockStoreExecute,
    } as unknown as UnblockStoreUseCase;
    const useCaseWithUnblock = new MarkInvoiceAsPaidUseCase(
      invoiceRepository,
      createPassThroughUnitOfWork(),
      unblockStore,
    );

    await useCaseWithUnblock.execute({ invoiceId: invoice.id, method: 'PIX' });

    expect(unblockStoreExecute).not.toHaveBeenCalled();
  });
});
