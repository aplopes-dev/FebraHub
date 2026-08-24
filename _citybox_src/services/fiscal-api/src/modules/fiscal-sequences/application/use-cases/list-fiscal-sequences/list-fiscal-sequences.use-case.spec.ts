import { randomUUID } from 'crypto';
import { ListFiscalSequencesUseCase } from './list-fiscal-sequences.use-case';
import { InMemoryFiscalSequenceRepository } from '../../../../fiscal-documents/tests/in-memory-fiscal-sequence.repository';
import { FiscalSequence } from '../../../../fiscal-documents/domain/entities/fiscal-sequence.entity';
import { AllowAllCompanyAccessPolicy } from '../../../../../shared/domain/tenant/company-access.policy';
import type { FiscalDocumentEnvironment } from '../../../../fiscal-documents/domain/entities/fiscal-document.entity';
import type { AuthenticatedUser } from '../../../../../shared/infra/http/auth/authenticated-user';

const COMPANY = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const USER: AuthenticatedUser = { sub: 'u', roles: [] };

function seed(
  repo: InMemoryFiscalSequenceRepository,
  companyId: string,
  environment: FiscalDocumentEnvironment,
) {
  return repo.save(
    FiscalSequence.with(
      {
        companyId,
        documentType: 'NFE',
        series: '1',
        currentNumber: 0n,
        environment,
        active: true,
      },
      randomUUID(),
    ),
  );
}

describe('ListFiscalSequencesUseCase', () => {
  let repo: InMemoryFiscalSequenceRepository;
  let useCase: ListFiscalSequencesUseCase;

  beforeEach(async () => {
    repo = new InMemoryFiscalSequenceRepository();
    useCase = new ListFiscalSequencesUseCase(
      repo,
      new AllowAllCompanyAccessPolicy(),
    );
    await seed(repo, COMPANY, 'HOMOLOGATION');
    await seed(repo, COMPANY, 'PRODUCTION');
    await seed(repo, OTHER, 'HOMOLOGATION');
  });

  it('lista só as séries do Emitente pedido', async () => {
    const all = await useCase.execute({ companyId: COMPANY, user: USER });
    expect(all).toHaveLength(2);
    expect(all.every((s) => s.companyId === COMPANY)).toBe(true);
  });

  it('filtra por ambiente', async () => {
    const homolog = await useCase.execute({
      companyId: COMPANY,
      environment: 'HOMOLOGATION',
      user: USER,
    });
    expect(homolog).toHaveLength(1);
    expect(homolog[0].environment).toBe('HOMOLOGATION');
  });
});
