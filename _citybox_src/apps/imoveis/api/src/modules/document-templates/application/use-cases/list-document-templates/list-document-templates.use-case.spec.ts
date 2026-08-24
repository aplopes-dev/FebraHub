import { InMemoryDocumentTemplateRepository } from '../../../infrastructure/database/in-memory-document-template.repository';
import { ListDocumentTemplatesUseCase } from './list-document-templates.use-case';
import { CreateDocumentTemplateUseCase } from '../create-document-template/create-document-template.use-case';
import { SeedDefaultDocumentTemplatesUseCase } from '../seed-default-document-templates/seed-default-document-templates.use-case';

describe('ListDocumentTemplatesUseCase', () => {
  it('pagina no servidor e filtra por tipo', async () => {
    const repo = new InMemoryDocumentTemplateRepository();
    const create = new CreateDocumentTemplateUseCase(repo);
    await create.execute({
      storeId: 's1',
      nome: 'Visita',
      tipo: 'termo-visita',
      conteudoHtml: '<p>{{lead.nome}}</p>',
    });
    await create.execute({
      storeId: 's1',
      nome: 'Recibo',
      tipo: 'recibo-sinal',
      conteudoHtml: '<p>{{negocio.valor}}</p>',
    });
    const list = new ListDocumentTemplatesUseCase(repo);
    const result = await list.execute({
      storeId: 's1',
      tipo: 'termo-visita',
      page: 1,
      perPage: 20,
    });
    expect(result.total).toBe(1);
    expect(result.items[0]?.nome).toBe('Visita');
  });
});

describe('SeedDefaultDocumentTemplatesUseCase', () => {
  it('é idempotente por tipo', async () => {
    const repo = new InMemoryDocumentTemplateRepository();
    const seed = new SeedDefaultDocumentTemplatesUseCase(repo);
    const first = await seed.execute({ storeId: 's1' });
    const second = await seed.execute({ storeId: 's1' });
    expect(first.length).toBeGreaterThan(0);
    expect(second).toHaveLength(0);
  });
});
