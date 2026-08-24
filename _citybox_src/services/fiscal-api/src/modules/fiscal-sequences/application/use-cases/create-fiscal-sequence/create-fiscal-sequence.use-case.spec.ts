import { CreateFiscalSequenceUseCase } from './create-fiscal-sequence.use-case';
import { InMemoryFiscalSequenceRepository } from '../../../../fiscal-documents/tests/in-memory-fiscal-sequence.repository';
import { AllowAllCompanyAccessPolicy } from '../../../../../shared/domain/tenant/company-access.policy';
import { SeriesDuplicateError } from '../../../domain/errors/series-duplicate.error';
import { SeriesInvalidFormatError } from '../../../domain/errors/series-invalid-format.error';
import { CompanyNotFoundError } from '../../../../companies/domain/errors/company-not-found.error';
import type { AuthenticatedUser } from '../../../../../shared/infra/http/auth/authenticated-user';

const COMPANY = '11111111-1111-4111-8111-111111111111';
const USER: AuthenticatedUser = { sub: 'user-1', roles: [] };

class DenyAllPolicy extends AllowAllCompanyAccessPolicy {
  override canActFor(): Promise<boolean> {
    return Promise.resolve(false);
  }
}

describe('CreateFiscalSequenceUseCase', () => {
  let repo: InMemoryFiscalSequenceRepository;
  let useCase: CreateFiscalSequenceUseCase;

  beforeEach(() => {
    repo = new InMemoryFiscalSequenceRepository();
    useCase = new CreateFiscalSequenceUseCase(
      repo,
      new AllowAllCompanyAccessPolicy(),
    );
  });

  it('cria série canonicalizando "001" → "1" e nasce ativa', async () => {
    const seq = await useCase.execute({
      companyId: COMPANY,
      documentType: 'NFE',
      series: '001',
      initialNumber: 4520,
      environment: 'HOMOLOGATION',
      user: USER,
    });

    expect(seq.series).toBe('1');
    expect(seq.currentNumber).toBe(4520n);
    expect(seq.active).toBe(true);
  });

  it('bloqueia duplicidade de chave com SeriesDuplicateError (não erro de banco)', async () => {
    const base = {
      companyId: COMPANY,
      documentType: 'NFE' as const,
      environment: 'HOMOLOGATION' as const,
      user: USER,
    };
    await useCase.execute({ ...base, series: '1' });

    // "001" canonicaliza para "1" → mesma chave.
    await expect(
      useCase.execute({ ...base, series: '001' }),
    ).rejects.toBeInstanceOf(SeriesDuplicateError);
  });

  it('rejeita formato de série inválido', async () => {
    await expect(
      useCase.execute({
        companyId: COMPANY,
        documentType: 'NFE',
        series: 'AB',
        environment: 'HOMOLOGATION',
        user: USER,
      }),
    ).rejects.toBeInstanceOf(SeriesInvalidFormatError);
  });

  it('nega acesso cross-tenant com 404 (CompanyNotFoundError)', async () => {
    const denied = new CreateFiscalSequenceUseCase(repo, new DenyAllPolicy());
    await expect(
      denied.execute({
        companyId: COMPANY,
        documentType: 'NFE',
        series: '1',
        environment: 'HOMOLOGATION',
        user: USER,
      }),
    ).rejects.toBeInstanceOf(CompanyNotFoundError);
  });
});
