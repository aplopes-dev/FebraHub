import { GetFiscalDocumentsSummaryUseCase } from './get-fiscal-documents-summary.use-case';
import { InMemoryFiscalDocumentRepository } from '../../../tests/in-memory-fiscal-document.repository';
import { buildFiscalDocument } from '../../../tests/fixtures/fiscal-document.fixture';

const COMPANY_A = '11111111-1111-4111-8111-111111111111';
const COMPANY_B = '22222222-2222-4222-8222-222222222222';

describe('GetFiscalDocumentsSummaryUseCase', () => {
  it('counts total/authorized/cancelled scoped to companyId (FR-003)', async () => {
    const repo = new InMemoryFiscalDocumentRepository();
    await repo.save(
      buildFiscalDocument({ companyId: COMPANY_A, status: 'AUTHORIZED' }),
    );
    await repo.save(
      buildFiscalDocument({ companyId: COMPANY_A, status: 'AUTHORIZED' }),
    );
    await repo.save(
      buildFiscalDocument({
        companyId: COMPANY_A,
        status: 'CANCEL_AUTHORIZED',
      }),
    );
    await repo.save(
      buildFiscalDocument({ companyId: COMPANY_A, status: 'REJECTED' }),
    );
    // Outra empresa não pode vazar para o total desta.
    await repo.save(
      buildFiscalDocument({ companyId: COMPANY_B, status: 'AUTHORIZED' }),
    );

    const useCase = new GetFiscalDocumentsSummaryUseCase(repo);
    const result = await useCase.execute({ companyId: COMPANY_A });

    expect(result.total).toBe(4);
    expect(result.authorized).toBe(2);
    expect(result.cancelled).toBe(1);
  });

  it('returns zeros when the company has no documents', async () => {
    const repo = new InMemoryFiscalDocumentRepository();
    const useCase = new GetFiscalDocumentsSummaryUseCase(repo);

    const result = await useCase.execute({ companyId: COMPANY_A });

    expect(result).toEqual({ total: 0, authorized: 0, cancelled: 0 });
  });

  it('respects the search filter (same set as the list — FR-003)', async () => {
    const repo = new InMemoryFiscalDocumentRepository();
    await repo.save(
      buildFiscalDocument({
        companyId: COMPANY_A,
        number: 'NF-000123',
        status: 'AUTHORIZED',
      }),
    );
    await repo.save(
      buildFiscalDocument({
        companyId: COMPANY_A,
        number: 'NF-000456',
        status: 'AUTHORIZED',
      }),
    );

    const useCase = new GetFiscalDocumentsSummaryUseCase(repo);
    const result = await useCase.execute({
      companyId: COMPANY_A,
      search: '000123',
    });

    expect(result.total).toBe(1);
    expect(result.authorized).toBe(1);
  });

  it('respects the documentType filter', async () => {
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
        status: 'AUTHORIZED',
      }),
    );

    const useCase = new GetFiscalDocumentsSummaryUseCase(repo);
    const result = await useCase.execute({
      companyId: COMPANY_A,
      documentType: 'NFE',
    });

    expect(result.total).toBe(1);
  });
});
