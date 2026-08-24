import { SyncAgentCatalogLeadsUseCase } from './sync-agent-catalog-leads.use-case';
import { InMemoryLeadRepository } from '../../../infrastructure/database/in-memory-lead.repository';
import { makeCreateLeadUseCase } from '../shared/lead-use-case-test-fixtures';
import { InMemoryAppointmentRepository } from '../../../../appointments/infrastructure/database/in-memory-appointment.repository';

const STORE = 'store-1';
const AGENT = 'agent-1';
const FALLBACK = 'agent-fallback';

describe('SyncAgentCatalogLeadsUseCase', () => {
  async function seedThree() {
    const repo = new InMemoryLeadRepository();
    const create = makeCreateLeadUseCase(
      repo,
      new InMemoryAppointmentRepository(),
    );
    const a = await create.execute({
      storeId: STORE,
      name: 'A',
      status: 'new',
      leadSource: 'website',
      interestedPropertyType: 'apartment',
      purpose: 'buying',
      agentId: AGENT,
      agentIds: [AGENT],
    });
    const b = await create.execute({
      storeId: STORE,
      name: 'B',
      status: 'new',
      leadSource: 'website',
      interestedPropertyType: 'apartment',
      purpose: 'buying',
      agentId: 'other',
      agentIds: ['other'],
    });
    const c = await create.execute({
      storeId: STORE,
      name: 'C',
      status: 'new',
      leadSource: 'website',
      interestedPropertyType: 'apartment',
      purpose: 'buying',
      agentId: AGENT,
      agentIds: [AGENT],
    });
    return { repo, a, b, c };
  }

  it('atribui agentId aos selecionados e devolve fallback aos removidos', async () => {
    const { repo, a, b, c } = await seedThree();
    const useCase = new SyncAgentCatalogLeadsUseCase(repo);

    await useCase.execute({
      storeId: STORE,
      agentId: AGENT,
      leadIds: [b.id],
      fallbackAgentId: FALLBACK,
    });

    expect((await repo.findById(STORE, a.id))?.agentId).toBe(FALLBACK);
    expect((await repo.findById(STORE, b.id))?.agentId).toBe(AGENT);
    expect((await repo.findById(STORE, c.id))?.agentId).toBe(FALLBACK);
  });

  it('usa fallback padrão quando fallbackAgentId não é informado', async () => {
    const { repo, a } = await seedThree();
    const useCase = new SyncAgentCatalogLeadsUseCase(repo);

    await useCase.execute({
      storeId: STORE,
      agentId: AGENT,
      leadIds: [],
    });

    expect((await repo.findById(STORE, a.id))?.agentId).toBe('bruno-costa');
  });
});
