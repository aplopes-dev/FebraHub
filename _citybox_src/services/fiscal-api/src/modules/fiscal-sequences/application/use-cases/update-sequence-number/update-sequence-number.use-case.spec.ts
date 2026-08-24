import { randomUUID } from 'crypto';
import { UpdateSequenceNumberUseCase } from './update-sequence-number.use-case';
import { InMemoryFiscalSequenceRepository } from '../../../../fiscal-documents/tests/in-memory-fiscal-sequence.repository';
import { InMemoryFiscalSequenceNumberChangeRepository } from '../../../tests/in-memory-fiscal-sequence-number-change.repository';
import { InMemorySequenceNumberUpdater } from '../../../tests/in-memory-sequence-number-updater';
import { FiscalSequence } from '../../../../fiscal-documents/domain/entities/fiscal-sequence.entity';
import { AllowAllCompanyAccessPolicy } from '../../../../../shared/domain/tenant/company-access.policy';
import { SeriesNumberDecreaseError } from '../../../domain/errors/series-number-decrease.error';
import { SeriesNotFoundError } from '../../../domain/errors/series-not-found.error';
import type { AuthenticatedUser } from '../../../../../shared/infra/http/auth/authenticated-user';

const COMPANY = '11111111-1111-4111-8111-111111111111';
const USER: AuthenticatedUser = { sub: 'user-1', roles: [], username: 'ana' };

function seedSequence(repo: InMemoryFiscalSequenceRepository, current: bigint) {
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

describe('UpdateSequenceNumberUseCase', () => {
  let repo: InMemoryFiscalSequenceRepository;
  let audit: InMemoryFiscalSequenceNumberChangeRepository;
  let useCase: UpdateSequenceNumberUseCase;

  beforeEach(() => {
    repo = new InMemoryFiscalSequenceRepository();
    audit = new InMemoryFiscalSequenceNumberChangeRepository();
    useCase = new UpdateSequenceNumberUseCase(
      repo,
      new InMemorySequenceNumberUpdater(repo, audit),
      new AllowAllCompanyAccessPolicy(),
    );
  });

  it('aumenta o número e registra auditoria (quem, de quanto para quanto)', async () => {
    const seq = await seedSequence(repo, 100n);

    const updated = await useCase.execute({
      sequenceId: seq.id,
      newNumber: 4520,
      user: USER,
    });

    expect(updated.currentNumber).toBe(4520n);
    const log = await audit.listBySequence(seq.id);
    expect(log).toHaveLength(1);
    expect(log[0].previousNumber).toBe(100n);
    expect(log[0].newNumber).toBe(4520n);
    expect(log[0].changedByUserId).toBe('user-1');
  });

  it('bloqueia redução do número (SeriesNumberDecreaseError) e não audita', async () => {
    const seq = await seedSequence(repo, 4520n);

    await expect(
      useCase.execute({ sequenceId: seq.id, newNumber: 100, user: USER }),
    ).rejects.toBeInstanceOf(SeriesNumberDecreaseError);
    expect(await audit.listBySequence(seq.id)).toHaveLength(0);
  });

  it('número igual é idempotente (sem auditoria)', async () => {
    const seq = await seedSequence(repo, 100n);
    const updated = await useCase.execute({
      sequenceId: seq.id,
      newNumber: 100,
      user: USER,
    });
    expect(updated.currentNumber).toBe(100n);
    expect(await audit.listBySequence(seq.id)).toHaveLength(0);
  });

  it('404 quando a série não existe', async () => {
    await expect(
      useCase.execute({ sequenceId: randomUUID(), newNumber: 10, user: USER }),
    ).rejects.toBeInstanceOf(SeriesNotFoundError);
  });
});
