import { GetGeneratedDocumentUseCase } from './get-generated-document.use-case';
import { InMemoryGeneratedDocumentRepository } from '../../../infrastructure/database/in-memory-generated-document.repository';
import { InMemoryObjectStorage } from '../../../../../shared/infra/storage/in-memory-object-storage';
import { emptyMergeSnapshot } from '../../policies/document-variable-catalog';
import { GeneratedDocumentNotFoundError } from '../../../domain/errors/generated-document-not-found.error';

describe('GetGeneratedDocumentUseCase', () => {
  it('404 quando não existe', async () => {
    const useCase = new GetGeneratedDocumentUseCase(
      new InMemoryGeneratedDocumentRepository(),
      new InMemoryObjectStorage(),
    );
    await expect(
      useCase.execute({ storeId: 's1', id: 'missing' }),
    ).rejects.toBeInstanceOf(GeneratedDocumentNotFoundError);
  });

  it('devolve o PDF persistido', async () => {
    const generated = new InMemoryGeneratedDocumentRepository();
    const storage = new InMemoryObjectStorage();
    const doc = await generated.create({
      storeId: 's1',
      templateId: 't1',
      titulo: 'Contrato',
      conteudoRender: '<p>x</p>',
      dadosSnapshot: emptyMergeSnapshot(),
      objectKey: 's1/documents/g1.pdf',
      mimeType: 'application/pdf',
    });
    await storage.put({
      key: doc.objectKey,
      buffer: Buffer.from('%PDF'),
      mimeType: 'application/pdf',
    });
    const result = await new GetGeneratedDocumentUseCase(
      generated,
      storage,
    ).execute({ storeId: 's1', id: doc.id });
    expect(result.buffer.toString()).toBe('%PDF');
  });
});
