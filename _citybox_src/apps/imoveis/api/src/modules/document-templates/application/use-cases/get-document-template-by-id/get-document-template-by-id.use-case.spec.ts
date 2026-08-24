import { GetDocumentTemplateByIdUseCase } from './get-document-template-by-id.use-case';
import { InMemoryDocumentTemplateRepository } from '../../../infrastructure/database/in-memory-document-template.repository';
import { DocumentTemplateNotFoundError } from '../../../domain/errors/document-template-not-found.error';

describe('GetDocumentTemplateByIdUseCase', () => {
  it('retorna 404 de domínio quando não existe', async () => {
    const useCase = new GetDocumentTemplateByIdUseCase(
      new InMemoryDocumentTemplateRepository(),
    );
    await expect(
      useCase.execute({ storeId: 's1', id: 'missing' }),
    ).rejects.toBeInstanceOf(DocumentTemplateNotFoundError);
  });
});
