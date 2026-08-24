import { DeleteLeadUseCase } from './delete-lead.use-case';
import { LeadNotFoundError } from '../../../domain/errors/lead-not-found.error';
import { InMemoryLeadRepository } from '../../../infrastructure/database/in-memory-lead.repository';
import { InMemoryAppointmentRepository } from '../../../../appointments/infrastructure/database/in-memory-appointment.repository';
import { makeCreateLeadUseCase } from '../shared/lead-use-case-test-fixtures';

const STORE = 'store-1';

describe('DeleteLeadUseCase', () => {
  async function seed() {
    const repo = new InMemoryLeadRepository();
    const created = await makeCreateLeadUseCase(
      repo,
      new InMemoryAppointmentRepository(),
    ).execute({
      storeId: STORE,
      name: 'Ana Silva',
      status: 'new',
      leadSource: 'website',
      interestedPropertyType: 'apartment',
      purpose: 'buying',
    });
    return { repo, id: created.id };
  }

  it('remove lead existente', async () => {
    const { repo, id } = await seed();
    const useCase = new DeleteLeadUseCase(repo);

    await useCase.execute({ storeId: STORE, id });

    expect(await repo.findById(STORE, id)).toBeNull();
  });

  it('404 quando lead não existe', async () => {
    const repo = new InMemoryLeadRepository();
    const useCase = new DeleteLeadUseCase(repo);

    await expect(
      useCase.execute({ storeId: STORE, id: 'missing' }),
    ).rejects.toBeInstanceOf(LeadNotFoundError);
  });

  it('404 quando lead é de outra store', async () => {
    const { repo, id } = await seed();
    const useCase = new DeleteLeadUseCase(repo);

    await expect(
      useCase.execute({ storeId: 'other-store', id }),
    ).rejects.toBeInstanceOf(LeadNotFoundError);

    expect(await repo.findById(STORE, id)).not.toBeNull();
  });
});
