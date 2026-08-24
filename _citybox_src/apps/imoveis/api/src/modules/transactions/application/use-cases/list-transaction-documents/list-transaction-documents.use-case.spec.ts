import { InMemoryLeadRepository } from '../../../../leads/infrastructure/database/in-memory-lead.repository';
import { InMemoryAppointmentRepository } from '../../../../appointments/infrastructure/database/in-memory-appointment.repository';
import { InMemoryDealRepository } from '../../../../deals/infrastructure/database/in-memory-deal.repository';
import { InMemoryObjectStorage } from '../../../../../shared/infra/storage/in-memory-object-storage';
import { InMemoryPropertyRepository } from '../../../../properties/infrastructure/database/in-memory-property.repository';
import { InMemoryTransactionRepository } from '../../../infrastructure/database/in-memory-transaction.repository';
import { UploadPropertyDocumentUseCase } from '../../../../properties/application/use-cases/upload-property-document/upload-property-document.use-case';
import { makeCreateLeadUseCase } from '../../../../leads/application/use-cases/shared/lead-use-case-test-fixtures';
import { seedTransaction, TEST_STORE } from '../shared/transaction-test-fixtures';
import { TransactionNotFoundError } from '../../../domain/errors/transaction-not-found.error';
import { ListTransactionDocumentsUseCase } from './list-transaction-documents.use-case';

const PDF_BUFFER = Buffer.from('%PDF-1.7\nconteudo', 'binary');

describe('ListTransactionDocumentsUseCase', () => {
  async function setup() {
    const transactions = new InMemoryTransactionRepository();
    const leads = new InMemoryLeadRepository();
    const properties = new InMemoryPropertyRepository();
    const deals = new InMemoryDealRepository();
    const appointments = new InMemoryAppointmentRepository();
    return {
      transactions,
      leads,
      properties,
      createLead: makeCreateLeadUseCase(leads, appointments, deals),
      uploadPropertyDoc: new UploadPropertyDocumentUseCase(
        properties,
        new InMemoryObjectStorage(),
      ),
      useCase: new ListTransactionDocumentsUseCase(
        transactions,
        leads,
        properties,
      ),
    };
  }

  it('agrega docs do lead e do imóvel e deduplica objectKey', async () => {
    const ctx = await setup();
    const property = await ctx.properties.create({
      storeId: TEST_STORE,
      name: 'Casa Pontal',
      type: 'house',
      status: 'available',
      listingType: 'sale',
    });
    const withDoc = await ctx.uploadPropertyDoc.execute({
      storeId: TEST_STORE,
      propertyId: property.id,
      buffer: PDF_BUFFER,
      filename: 'Escritura.pdf',
    });
    const propertyDoc = withDoc.documents[0]!;
    const lead = await ctx.createLead.execute({
      storeId: TEST_STORE,
      name: 'Ana',
      status: 'negotiating',
      leadSource: 'website',
      interestedPropertyType: 'house',
      purpose: 'buying',
    });
    await ctx.leads.addDocument(TEST_STORE, lead.id, {
      id: 'lead-doc-1',
      name: 'Escritura.pdf',
      sizeLabel: '10 KB',
      kind: 'other',
      addedAt: new Date(),
      objectKey: propertyDoc.objectKey,
      mimeType: 'application/pdf',
    });
    await ctx.leads.addDocument(TEST_STORE, lead.id, {
      id: 'lead-doc-2',
      name: 'Contrato.pdf',
      sizeLabel: '20 KB',
      kind: 'contract',
      addedAt: new Date(),
      objectKey: 'lead-only-key',
      mimeType: 'application/pdf',
    });
    const tx = await seedTransaction(ctx.transactions, {
      leadId: lead.id,
      propertyId: property.id,
    });

    const result = await ctx.useCase.execute({
      storeId: TEST_STORE,
      id: tx.id,
    });

    expect(result.items).toHaveLength(2);
    expect(result.items.some((d) => d.kind === 'contract')).toBe(true);
    expect(result.checklist.find((i) => i.id === 'contract')?.status).toBe(
      'attached',
    );
    expect(result.checklist.find((i) => i.id === 'property')?.status).toBe(
      'attached',
    );
  });

  it('throws when the transaction belongs to another store', async () => {
    const ctx = await setup();
    const tx = await seedTransaction(ctx.transactions, { storeId: 'other' });
    await expect(
      ctx.useCase.execute({ storeId: TEST_STORE, id: tx.id }),
    ).rejects.toBeInstanceOf(TransactionNotFoundError);
  });
});
