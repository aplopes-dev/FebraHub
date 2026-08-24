import { buildTsquery } from '../../policies/build-tsquery';
import { InMemorySearchRepository } from '../../../infrastructure/database/in-memory-search.repository';
import { GlobalSearchUseCase } from './global-search.use-case';

describe('GlobalSearchUseCase', () => {
  const repo = new InMemorySearchRepository();
  const useCase = new GlobalSearchUseCase(repo);

  const fullScope = {
    includePatients: true,
    includeAppointments: true,
    includeOpportunities: true,
    includeStock: true,
  };

  beforeEach(() => {
    repo.seed([
      {
        id: 'patient-1',
        type: 'patient',
        title: 'João Silva',
        subtitle: '71999999999',
        href: '/pacientes/1/sobre',
      },
      {
        id: 'appointment-1',
        type: 'appointment',
        title: 'João Silva',
        subtitle: 'Dr Ana · 2026-08-19',
        href: '/agenda?date=2026-08-19&appointmentId=1',
      },
      {
        id: 'opportunity-1',
        type: 'opportunity',
        title: 'Orçamento implante',
        subtitle: '71988887777',
        href: '/vendas?opportunityId=1',
      },
      {
        id: 'stock_product-1',
        type: 'stock_product',
        title: 'Luva cirúrgica',
        subtitle: 'Descartáveis · SKU-01',
        href: '/estoque',
      },
    ]);
  });

  it('buildTsquery joins tokens with prefix', () => {
    expect(buildTsquery('João Silva')).toBe('joao:* & silva:*');
  });

  it('returns empty groups for blank query', async () => {
    const result = await useCase.execute({ storeId: 's1', q: '   ', scope: fullScope });
    expect(result.groups).toEqual([]);
  });

  it('groups hits by type in stable order', async () => {
    const result = await useCase.execute({ storeId: 's1', q: 'joao', scope: fullScope });
    expect(result.groups.map((g) => g.heading)).toEqual(['Pacientes', 'Agenda']);
    expect(result.groups[0].hits[0].title).toBe('João Silva');
  });

  it('requires all tokens (AND)', async () => {
    const hit = await useCase.execute({
      storeId: 's1',
      q: 'luva cirurgica',
      scope: fullScope,
    });
    expect(hit.groups).toHaveLength(1);
    expect(hit.groups[0].hits[0].type).toBe('stock_product');

    const miss = await useCase.execute({
      storeId: 's1',
      q: 'luva inexistente',
      scope: fullScope,
    });
    expect(miss.groups).toEqual([]);
  });

  it('respects perType limit', async () => {
    repo.seed(
      Array.from({ length: 5 }, (_, i) => ({
        id: `patient-${i}`,
        type: 'patient' as const,
        title: `Paciente Match ${i}`,
        subtitle: null,
        href: `/pacientes/${i}/sobre`,
      })),
    );
    const result = await useCase.execute({
      storeId: 's1',
      q: 'match',
      perType: 2,
      scope: { ...fullScope, includeAppointments: false, includeOpportunities: false, includeStock: false },
    });
    expect(result.groups[0].hits).toHaveLength(2);
  });

  it('skips opportunity group when no visible funnels', async () => {
    const result = await useCase.execute({
      storeId: 's1',
      q: 'orcamento',
      scope: {
        ...fullScope,
        includePatients: false,
        includeAppointments: false,
        includeStock: false,
        visibleFunnelIds: [],
      },
    });
    expect(result.groups).toEqual([]);
  });
});
