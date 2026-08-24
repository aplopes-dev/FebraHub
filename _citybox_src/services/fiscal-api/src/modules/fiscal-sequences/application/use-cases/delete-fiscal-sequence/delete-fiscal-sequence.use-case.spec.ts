import { randomUUID } from 'crypto';
import { DeleteFiscalSequenceUseCase } from './delete-fiscal-sequence.use-case';
import { InMemoryFiscalSequenceRepository } from '../../../../fiscal-documents/tests/in-memory-fiscal-sequence.repository';
import { FiscalSequence } from '../../../../fiscal-documents/domain/entities/fiscal-sequence.entity';
import { AllowAllCompanyAccessPolicy } from '../../../../../shared/domain/tenant/company-access.policy';
import { SeriesInUseError } from '../../../domain/errors/series-in-use.error';
import type { AuthenticatedUser } from '../../../../../shared/infra/http/auth/authenticated-user';

const COMPANY = '11111111-1111-4111-8111-111111111111';
const USER: AuthenticatedUser = { sub: 'u', roles: [] };

function seed(repo: InMemoryFiscalSequenceRepository, current: bigint) {
  const seq = FiscalSequence.with(
    {
      companyId: COMPANY,
      documentType: 'NFE',
      series: '1',
      currentNumber: current,
      environment: 'HOMOLOGATION',
      active: true,
    },
    randomUUID(),
  );
  return repo.save(seq).then(() => seq);
}

describe('DeleteFiscalSequenceUseCase', () => {
  let repo: InMemoryFiscalSequenceRepository;
  let useCase: DeleteFiscalSequenceUseCase;

  beforeEach(() => {
    repo = new InMemoryFiscalSequenceRepository();
    useCase = new DeleteFiscalSequenceUseCase(
      repo,
      new AllowAllCompanyAccessPolicy(),
    );
  });

  it('exclui série nunca usada (currentNumber 0)', async () => {
    const seq = await seed(repo, 0n);
    await useCase.execute({ sequenceId: seq.id, user: USER });
    expect(await repo.findById(seq.id)).toBeNull();
  });

  it('impede exclusão de série já usada (SeriesInUseError)', async () => {
    const seq = await seed(repo, 5n);
    await expect(
      useCase.execute({ sequenceId: seq.id, user: USER }),
    ).rejects.toBeInstanceOf(SeriesInUseError);
    expect(await repo.findById(seq.id)).not.toBeNull();
  });
});
