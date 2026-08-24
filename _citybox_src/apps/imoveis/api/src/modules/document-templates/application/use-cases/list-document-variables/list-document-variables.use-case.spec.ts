import { ListDocumentVariablesUseCase } from './list-document-variables.use-case';

describe('ListDocumentVariablesUseCase', () => {
  it('devolve o catálogo fixo', async () => {
    const result = await new ListDocumentVariablesUseCase().execute();
    expect(result.variables.some((v) => v.key === 'lead.nome')).toBe(true);
  });
});
