import { ListFiscalDocumentsUseCase } from './list-fiscal-documents.use-case';
import { InMemoryFiscalDocumentRepository } from '../../../tests/in-memory-fiscal-document.repository';
import { buildFiscalDocument } from '../../../tests/fixtures/fiscal-document.fixture';

const COMPANY_A = '11111111-1111-4111-8111-111111111111';
const COMPANY_B = '22222222-2222-4222-8222-222222222222';

describe('ListFiscalDocumentsUseCase', () => {
  it('scopes results to the given companyId', async () => {
    const repo = new InMemoryFiscalDocumentRepository();
    await repo.save(buildFiscalDocument({ companyId: COMPANY_A }));
    await repo.save(buildFiscalDocument({ companyId: COMPANY_B }));

    const useCase = new ListFiscalDocumentsUseCase(repo);
    const result = await useCase.execute({ companyId: COMPANY_A });

    expect(result.documents).toHaveLength(1);
    expect(result.documents[0].companyId).toBe(COMPANY_A);
  });

  it('filters by documentType and status', async () => {
    const repo = new InMemoryFiscalDocumentRepository();
    await repo.save(
      buildFiscalDocument({
        companyId: COMPANY_A,
        documentType: 'NFE',
        status: 'AUTHORIZED',
      }),
    );
    await repo.save(
      buildFiscalDocument({
        companyId: COMPANY_A,
        documentType: 'NFSE',
        status: 'REJECTED',
      }),
    );

    const useCase = new ListFiscalDocumentsUseCase(repo);
    const result = await useCase.execute({
      companyId: COMPANY_A,
      documentType: 'NFE',
      status: 'AUTHORIZED',
    });

    expect(result.documents).toHaveLength(1);
    expect(result.documents[0].documentType).toBe('NFE');
  });

  it('paginates and reports totalPages', async () => {
    const repo = new InMemoryFiscalDocumentRepository();
    for (let i = 0; i < 3; i += 1) {
      await repo.save(buildFiscalDocument({ companyId: COMPANY_A }));
    }

    const useCase = new ListFiscalDocumentsUseCase(repo);
    const result = await useCase.execute({
      companyId: COMPANY_A,
      page: 1,
      perPage: 2,
    });

    expect(result.documents).toHaveLength(2);
    expect(result.total).toBe(3);
    expect(result.totalPages).toBe(2);
  });

  /// FR-005 da spec `009-facilita-nfe-screen` — busca por número/série,
  /// resolvida no repositório (Constitution Princípio II).
  it('filters by search on number', async () => {
    const repo = new InMemoryFiscalDocumentRepository();
    await repo.save(
      buildFiscalDocument({ companyId: COMPANY_A, number: 'NF-000123' }),
    );
    await repo.save(
      buildFiscalDocument({ companyId: COMPANY_A, number: 'NF-000456' }),
    );

    const useCase = new ListFiscalDocumentsUseCase(repo);
    const result = await useCase.execute({
      companyId: COMPANY_A,
      search: '000123',
    });

    expect(result.documents).toHaveLength(1);
    expect(result.documents[0].number).toBe('NF-000123');
  });

  it('filters by search on series', async () => {
    const repo = new InMemoryFiscalDocumentRepository();
    await repo.save(
      buildFiscalDocument({ companyId: COMPANY_A, series: 'A1' }),
    );
    await repo.save(
      buildFiscalDocument({ companyId: COMPANY_A, series: 'B2' }),
    );

    const useCase = new ListFiscalDocumentsUseCase(repo);
    const result = await useCase.execute({
      companyId: COMPANY_A,
      search: 'a1',
    });

    expect(result.documents).toHaveLength(1);
    expect(result.documents[0].series).toBe('A1');
  });
});
