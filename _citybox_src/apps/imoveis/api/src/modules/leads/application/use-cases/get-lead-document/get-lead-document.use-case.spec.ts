import { GetLeadDocumentUseCase } from './get-lead-document.use-case';
import { InMemoryLeadRepository } from '../../../infrastructure/database/in-memory-lead.repository';
import { InMemoryObjectStorage } from '../../../../../shared/infra/storage/in-memory-object-storage';
import { LeadNotFoundError } from '../../../domain/errors/lead-not-found.error';

describe('GetLeadDocumentUseCase', () => {
  it('404 se o lead não existe', async () => {
    const useCase = new GetLeadDocumentUseCase(
      new InMemoryLeadRepository(),
      new InMemoryObjectStorage(),
    );
    await expect(
      useCase.execute({
        storeId: 's1',
        leadId: 'missing',
        documentId: 'd1',
      }),
    ).rejects.toBeInstanceOf(LeadNotFoundError);
  });
});
