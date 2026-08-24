import { GetLeadByIdUseCase } from './get-lead-by-id.use-case';
import { LeadNotFoundError } from '../../../domain/errors/lead-not-found.error';
import { InMemoryLeadRepository } from '../../../infrastructure/database/in-memory-lead.repository';
import { InMemoryAppointmentRepository } from '../../../../appointments/infrastructure/database/in-memory-appointment.repository';
import { makeCreateLeadUseCase } from '../shared/lead-use-case-test-fixtures';

const STORE = 'store-1';

describe('GetLeadByIdUseCase', () => {
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

  it('retorna lead existente da store', async () => {
    const { repo, id } = await seed();
    const useCase = new GetLeadByIdUseCase(repo);

    const lead = await useCase.execute({ storeId: STORE, id });

    expect(lead.id).toBe(id);
    expect(lead.name).toBe('Ana Silva');
  });

  it('404 quando id não existe', async () => {
    const repo = new InMemoryLeadRepository();
    const useCase = new GetLeadByIdUseCase(repo);

    await expect(
      useCase.execute({ storeId: STORE, id: 'missing' }),
    ).rejects.toBeInstanceOf(LeadNotFoundError);
  });

  it('404 quando lead é de outra store', async () => {
    const { repo, id } = await seed();
    const useCase = new GetLeadByIdUseCase(repo);

    await expect(
      useCase.execute({ storeId: 'other-store', id }),
    ).rejects.toBeInstanceOf(LeadNotFoundError);
  });
});
