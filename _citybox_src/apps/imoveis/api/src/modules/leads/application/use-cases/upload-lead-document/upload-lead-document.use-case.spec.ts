import { UploadLeadDocumentUseCase } from './upload-lead-document.use-case';
import { InMemoryLeadRepository } from '../../../infrastructure/database/in-memory-lead.repository';
import { InMemoryAppointmentRepository } from '../../../../appointments/infrastructure/database/in-memory-appointment.repository';
import { InMemoryDealRepository } from '../../../../deals/infrastructure/database/in-memory-deal.repository';
import { InMemoryObjectStorage } from '../../../../../shared/infra/storage/in-memory-object-storage';
import { SyncActiveDealForLeadUseCase } from '../../../../deals/application/use-cases/sync-active-deal-for-lead/sync-active-deal-for-lead.use-case';
import { InMemoryPropertyRepository } from '../../../../properties/infrastructure/database/in-memory-property.repository';
import { InMemoryTransactionRepository } from '../../../../transactions/infrastructure/database/in-memory-transaction.repository';
import { makeCreateLeadUseCase } from '../shared/lead-use-case-test-fixtures';

describe('UploadLeadDocumentUseCase', () => {
  it('persiste PDF no storage e no lead', async () => {
    const leads = new InMemoryLeadRepository();
    const deals = new InMemoryDealRepository();
    const appointments = new InMemoryAppointmentRepository();
    const storage = new InMemoryObjectStorage();
    const lead = await makeCreateLeadUseCase(leads, appointments, deals).execute({
      storeId: 's1',
      name: 'Ana',
      status: 'new',
      leadSource: 'website',
      interestedPropertyType: 'house',
      purpose: 'buying',
    });
    const useCase = new UploadLeadDocumentUseCase(
      leads,
      storage,
      new SyncActiveDealForLeadUseCase(
        deals,
        new InMemoryPropertyRepository(),
        new InMemoryTransactionRepository(),
      ),
    );
    const updated = await useCase.execute({
      storeId: 's1',
      leadId: lead.id,
      buffer: Buffer.from('%PDF-1.4 test'),
      filename: 'rg.pdf',
      kind: 'other',
    });
    expect(updated.documents.some((d) => d.name === 'rg.pdf' && d.objectKey)).toBe(
      true,
    );
  });
});
