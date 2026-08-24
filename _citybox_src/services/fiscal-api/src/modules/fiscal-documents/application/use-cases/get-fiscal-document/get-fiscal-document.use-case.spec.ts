import { GetFiscalDocumentUseCase } from './get-fiscal-document.use-case';
import { InMemoryFiscalDocumentRepository } from '../../../tests/in-memory-fiscal-document.repository';
import { buildFiscalDocument } from '../../../tests/fixtures/fiscal-document.fixture';
import { FiscalDocumentNotFoundError } from '../../../domain/errors/fiscal-document-not-found.error';

describe('GetFiscalDocumentUseCase', () => {
  it('returns the document when it exists', async () => {
    const repo = new InMemoryFiscalDocumentRepository();
    const document = buildFiscalDocument();
    await repo.save(document);
    const useCase = new GetFiscalDocumentUseCase(repo);

    const found = await useCase.execute({ fiscalDocumentId: document.id });

    expect(found.id).toBe(document.id);
    expect(found.status).toBe('AUTHORIZED');
  });

  it('throws FiscalDocumentNotFoundError when the document does not exist', async () => {
    const repo = new InMemoryFiscalDocumentRepository();
    const useCase = new GetFiscalDocumentUseCase(repo);

    await expect(
      useCase.execute({
        fiscalDocumentId: '00000000-0000-4000-8000-000000000000',
      }),
    ).rejects.toBeInstanceOf(FiscalDocumentNotFoundError);
  });
});
