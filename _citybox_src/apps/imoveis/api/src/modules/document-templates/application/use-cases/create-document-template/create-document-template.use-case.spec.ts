import { CreateDocumentTemplateUseCase } from './create-document-template.use-case';
import { InMemoryDocumentTemplateRepository } from '../../../infrastructure/database/in-memory-document-template.repository';

describe('CreateDocumentTemplateUseCase', () => {
  it('cria modelo da loja', async () => {
    const repo = new InMemoryDocumentTemplateRepository();
    const useCase = new CreateDocumentTemplateUseCase(repo);
    const created = await useCase.execute({
      storeId: 's1',
      nome: 'CPCV',
      tipo: 'contrato-promessa-compra-venda',
      conteudoHtml: '<p>{{lead.nome}}</p>',
    });
    expect(created.nome).toBe('CPCV');
    expect(created.tipo).toBe('contrato-promessa-compra-venda');
  });
});
