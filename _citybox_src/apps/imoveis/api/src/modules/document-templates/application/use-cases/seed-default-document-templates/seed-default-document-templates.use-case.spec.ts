import { SeedDefaultDocumentTemplatesUseCase } from './seed-default-document-templates.use-case';
import { InMemoryDocumentTemplateRepository } from '../../../infrastructure/database/in-memory-document-template.repository';

describe('SeedDefaultDocumentTemplatesUseCase', () => {
  it('é idempotente', async () => {
    const repo = new InMemoryDocumentTemplateRepository();
    const useCase = new SeedDefaultDocumentTemplatesUseCase(repo);
    const first = await useCase.execute({ storeId: 's1' });
    const second = await useCase.execute({ storeId: 's1' });
    expect(first.length).toBeGreaterThan(0);
    expect(second).toHaveLength(first.length);
  });
});
