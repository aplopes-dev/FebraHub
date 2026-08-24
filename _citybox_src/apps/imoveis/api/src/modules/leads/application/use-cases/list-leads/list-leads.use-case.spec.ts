import { ListLeadsUseCase } from './list-leads.use-case';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { InMemoryLeadRepository } from '../../../infrastructure/database/in-memory-lead.repository';
import { InMemoryAppointmentRepository } from '../../../../appointments/infrastructure/database/in-memory-appointment.repository';
import { makeCreateLeadUseCase } from '../shared/lead-use-case-test-fixtures';

const STORE = 'store-1';

async function seedLead(
  repo: InMemoryLeadRepository,
  overrides: {
    name: string;
    status?:
      | 'new'
      | 'negotiating'
      | 'scheduled-visit'
      | 'closed-won'
      | 'cancelled';
    agentId?: string;
    nextFollowUp?: string;
  },
) {
  return makeCreateLeadUseCase(
    repo,
    new InMemoryAppointmentRepository(),
  ).execute({
    storeId: STORE,
    name: overrides.name,
    status: overrides.status ?? 'new',
    leadSource: 'website',
    interestedPropertyType: 'apartment',
    purpose: 'buying',
    agentId: overrides.agentId,
    agentIds: overrides.agentId ? [overrides.agentId] : undefined,
    nextFollowUp: overrides.nextFollowUp,
  });
}

describe('ListLeadsUseCase', () => {
  it('lista leads da store com paginação', async () => {
    const repo = new InMemoryLeadRepository();
    await seedLead(repo, { name: 'Ana' });
    await seedLead(repo, { name: 'Bruno' });
    await seedLead(repo, { name: 'Carla' });

    const useCase = new ListLeadsUseCase(repo);
    const result = await useCase.execute({
      storeId: STORE,
      page: 1,
      perPage: 2,
    });

    expect(result.total).toBe(3);
    expect(result.page).toBe(1);
    expect(result.perPage).toBe(2);
    expect(result.totalPages).toBe(2);
    expect(result.items).toHaveLength(2);
  });

  it('filtra por search e agentId', async () => {
    const repo = new InMemoryLeadRepository();
    await seedLead(repo, { name: 'Ana Silva', agentId: 'agent-1' });
    await seedLead(repo, { name: 'Bruno Costa', agentId: 'agent-2' });

    const useCase = new ListLeadsUseCase(repo);
    const byName = await useCase.execute({
      storeId: STORE,
      search: 'Ana',
    });
    expect(byName.total).toBe(1);
    expect(byName.items[0]?.name).toBe('Ana Silva');

    const byAgent = await useCase.execute({
      storeId: STORE,
      agentId: 'agent-2',
    });
    expect(byAgent.total).toBe(1);
    expect(byAgent.items[0]?.name).toBe('Bruno Costa');
  });

  it('não lista lead só co-designado em agentIds (dono primário de outro)', async () => {
    const repo = new InMemoryLeadRepository();
    const create = makeCreateLeadUseCase(
      repo,
      new InMemoryAppointmentRepository(),
    );
    await create.execute({
      storeId: STORE,
      name: 'Shared Lead',
      status: 'new',
      leadSource: 'website',
      interestedPropertyType: 'apartment',
      purpose: 'buying',
      agentId: 'owner',
      agentIds: ['owner', 'co-agent'],
    });
    await seedLead(repo, { name: 'Own Lead', agentId: 'co-agent' });

    const useCase = new ListLeadsUseCase(repo);
    const asCoAgent = await useCase.execute({
      storeId: STORE,
      agentId: 'co-agent',
    });
    expect(asCoAgent.total).toBe(1);
    expect(asCoAgent.items[0]?.name).toBe('Own Lead');

    const asOwner = await useCase.execute({
      storeId: STORE,
      agentId: 'owner',
    });
    expect(asOwner.total).toBe(1);
    expect(asOwner.items[0]?.name).toBe('Shared Lead');
  });

  it('filtra por status', async () => {
    const repo = new InMemoryLeadRepository();
    await seedLead(repo, { name: 'Novo', status: 'new' });
    await seedLead(repo, { name: 'Negociando', status: 'negotiating' });

    const useCase = new ListLeadsUseCase(repo);
    const result = await useCase.execute({
      storeId: STORE,
      status: ['negotiating'],
    });

    expect(result.total).toBe(1);
    expect(result.items[0]?.status).toBe('negotiating');
  });

  it('filtra por followUpUntil (retorno devido até a data, inclusive)', async () => {
    const repo = new InMemoryLeadRepository();
    await seedLead(repo, { name: 'Atrasado', nextFollowUp: '2026-07-20' });
    await seedLead(repo, { name: 'Hoje', nextFollowUp: '2026-07-29' });
    await seedLead(repo, { name: 'Futuro', nextFollowUp: '2026-08-05' });
    await seedLead(repo, { name: 'Sem retorno' });

    const useCase = new ListLeadsUseCase(repo);
    const result = await useCase.execute({
      storeId: STORE,
      followUpUntil: '2026-07-29',
    });

    expect(result.total).toBe(2);
    expect(result.items.map((l) => l.name).sort()).toEqual([
      'Atrasado',
      'Hoje',
    ]);
  });

  it('rejeita followUpUntil inválido', async () => {
    const repo = new InMemoryLeadRepository();
    const useCase = new ListLeadsUseCase(repo);

    await expect(
      useCase.execute({ storeId: STORE, followUpUntil: '29/07/2026' }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });

  it('rejeita filtro de status inválido', async () => {
    const repo = new InMemoryLeadRepository();
    const useCase = new ListLeadsUseCase(repo);

    await expect(
      useCase.execute({
        storeId: STORE,
        status: ['nope'],
      }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });

  it('não retorna leads de outra store', async () => {
    const repo = new InMemoryLeadRepository();
    await seedLead(repo, { name: 'Local' });
    await makeCreateLeadUseCase(
      repo,
      new InMemoryAppointmentRepository(),
    ).execute({
      storeId: 'other-store',
      name: 'Outro',
      status: 'new',
      leadSource: 'website',
      interestedPropertyType: 'house',
      purpose: 'buying',
    });

    const useCase = new ListLeadsUseCase(repo);
    const result = await useCase.execute({ storeId: STORE });

    expect(result.total).toBe(1);
    expect(result.items[0]?.name).toBe('Local');
  });
});
