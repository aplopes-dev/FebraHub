import { DeleteDocumentTemplateUseCase } from './delete-document-template.use-case';
import { CreateDocumentTemplateUseCase } from '../create-document-template/create-document-template.use-case';
import { InMemoryDocumentTemplateRepository } from '../../../infrastructure/database/in-memory-document-template.repository';

describe('DeleteDocumentTemplateUseCase', () => {
  it('remove o modelo', async () => {
    const repo = new InMemoryDocumentTemplateRepository();
    const created = await new CreateDocumentTemplateUseCase(repo).execute({
      storeId: 's1',
      nome: 'A',
      tipo: 'outro',
      conteudoHtml: '<p>x</p>',
    });
    await new DeleteDocumentTemplateUseCase(repo).execute({
      storeId: 's1',
      id: created.id,
    });
    expect(await repo.findById('s1', created.id)).toBeNull();
  });
});
