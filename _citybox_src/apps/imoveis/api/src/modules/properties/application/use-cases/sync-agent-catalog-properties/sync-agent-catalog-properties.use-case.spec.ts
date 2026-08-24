import { SyncAgentCatalogPropertiesUseCase } from './sync-agent-catalog-properties.use-case';
import { InMemoryPropertyRepository } from '../../../infrastructure/database/in-memory-property.repository';

const STORE = 'store-1';

describe('SyncAgentCatalogPropertiesUseCase', () => {
  it('atribui imóveis selecionados ao corretor e realoca os demais', async () => {
    const repo = new InMemoryPropertyRepository();
    const p1 = await repo.create({
      storeId: STORE,
      name: 'P1',
      type: 'house',
      status: 'available',
      listingType: 'sale',
      agentId: 'agent-a',
    });
    const p2 = await repo.create({
      storeId: STORE,
      name: 'P2',
      type: 'house',
      status: 'available',
      listingType: 'sale',
      agentId: 'agent-b',
    });
    const p3 = await repo.create({
      storeId: STORE,
      name: 'P3',
      type: 'house',
      status: 'available',
      listingType: 'sale',
      agentId: 'agent-b',
    });

    const useCase = new SyncAgentCatalogPropertiesUseCase(repo);
    await useCase.execute({
      storeId: STORE,
      agentId: 'agent-b',
      propertyIds: [p2.id],
      fallbackAgentId: 'fallback',
    });

    const afterP1 = await repo.findById(STORE, p1.id);
    const afterP2 = await repo.findById(STORE, p2.id);
    const afterP3 = await repo.findById(STORE, p3.id);

    expect(afterP1?.agentId).toBe('agent-a');
    expect(afterP2?.agentId).toBe('agent-b');
    expect(afterP3?.agentId).toBe('fallback');
  });
});
