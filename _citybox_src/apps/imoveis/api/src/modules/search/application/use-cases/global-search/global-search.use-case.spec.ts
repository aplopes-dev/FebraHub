import { buildTsquery } from '../../policies/build-tsquery';
import { InMemorySearchRepository } from '../../../infrastructure/database/in-memory-search.repository';
import { GlobalSearchUseCase } from './global-search.use-case';

describe('GlobalSearchUseCase', () => {
  const repo = new InMemorySearchRepository();
  const useCase = new GlobalSearchUseCase(repo);

  beforeEach(() => {
    repo.seed([
      {
        id: 'lead-1',
        type: 'lead',
        title: 'João Silva',
        subtitle: 'Ilhéus, BA',
        href: '/leads/1',
      },
      {
        id: 'property-1',
        type: 'property',
        title: 'Cobertura Centro',
        subtitle: 'Ilhéus, BA',
        href: '/properties/1',
      },
      {
        id: 'transaction-1',
        type: 'transaction',
        title: 'Venda Cobertura',
        subtitle: 'SALE · DRAFT',
        href: '/transactions/1',
      },
      {
        id: 'appointment-1',
        type: 'appointment',
        title: 'Visita João',
        subtitle: 'João Silva',
        href: '/calendar?date=2026-07-30&appointmentId=1',
      },
    ]);
  });

  it('buildTsquery joins tokens with prefix', () => {
    expect(buildTsquery('João Silva')).toBe('joao:* & silva:*');
  });

  it('returns empty groups for blank query', async () => {
    const result = await useCase.execute({ storeId: 's1', q: '   ' });
    expect(result.groups).toEqual([]);
  });

  it('groups hits by type in stable order', async () => {
    const result = await useCase.execute({ storeId: 's1', q: 'joao' });
    expect(result.groups.map((g) => g.heading)).toEqual(['Leads', 'Agenda']);
    expect(result.groups[0].hits[0].title).toBe('João Silva');
  });

  it('requires all tokens (AND)', async () => {
    const hit = await useCase.execute({
      storeId: 's1',
      q: 'cobertura centro',
    });
    expect(hit.groups).toHaveLength(1);
    expect(hit.groups[0].hits[0].type).toBe('property');

    const miss = await useCase.execute({
      storeId: 's1',
      q: 'cobertura salvador',
    });
    expect(miss.groups).toEqual([]);
  });

  it('respects perType limit', async () => {
    repo.seed(
      Array.from({ length: 5 }, (_, i) => ({
        id: `lead-${i}`,
        type: 'lead' as const,
        title: `Lead Match ${i}`,
        subtitle: null,
        href: `/leads/${i}`,
      })),
    );
    const result = await useCase.execute({
      storeId: 's1',
      q: 'match',
      perType: 2,
    });
    expect(result.groups[0].hits).toHaveLength(2);
  });
});
