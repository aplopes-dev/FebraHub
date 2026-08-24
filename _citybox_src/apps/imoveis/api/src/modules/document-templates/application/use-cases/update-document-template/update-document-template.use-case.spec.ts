import { UpdateDocumentTemplateUseCase } from './update-document-template.use-case';
import { CreateDocumentTemplateUseCase } from '../create-document-template/create-document-template.use-case';
import { InMemoryDocumentTemplateRepository } from '../../../infrastructure/database/in-memory-document-template.repository';

describe('UpdateDocumentTemplateUseCase', () => {
  it('atualiza nome', async () => {
    const repo = new InMemoryDocumentTemplateRepository();
    const created = await new CreateDocumentTemplateUseCase(repo).execute({
      storeId: 's1',
      nome: 'A',
      tipo: 'outro',
      conteudoHtml: '<p>x</p>',
    });
    const updated = await new UpdateDocumentTemplateUseCase(repo).execute({
      storeId: 's1',
      id: created.id,
      nome: 'B',
    });
    expect(updated.nome).toBe('B');
  });
});
