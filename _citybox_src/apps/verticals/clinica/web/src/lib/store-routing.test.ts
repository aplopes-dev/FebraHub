import { describe, expect, it } from 'vitest';
import { filterAccessibleStores, resolveStoreSwitchNavigation } from './store-routing';

describe('resolveStoreSwitchNavigation', () => {
  it('recarrega quando já está na raiz', () => {
    expect(resolveStoreSwitchNavigation('clinic', '/')).toBe('reload');
  });

  it('volta para a raiz a partir de páginas de detalhe', () => {
    expect(resolveStoreSwitchNavigation('clinic', '/pacientes/pat-1/sobre')).toEqual({ href: '/' });
    expect(resolveStoreSwitchNavigation('clinic', '/financeiro/transacoes')).toEqual({ href: '/' });
  });
});

describe('filterAccessibleStores', () => {
  const clinics = [
    { id: 'a', name: 'Clínica A', slug: 'a', vertical: 'clinic' },
    { id: 'b', name: 'Clínica B', slug: 'b', vertical: 'clinic' },
  ];

  it('retorna todas as clínicas com permissão', () => {
    const result = filterAccessibleStores(clinics, ['vertical_access']);
    expect(result).toHaveLength(2);
  });

  it('descarta lojas de outras verticais', () => {
    const mixed = [
      ...clinics,
      { id: 'c', name: 'Restaurante', slug: 'c', vertical: 'comercio' },
      { id: 'd', name: 'Mercado', slug: 'd', vertical: 'comercio' },
    ];
    const result = filterAccessibleStores(mixed, ['vertical_access']);
    expect(result.map((s) => s.id)).toEqual(['a', 'b']);
  });

  it('retorna vazio sem a permissão da clínica', () => {
    expect(filterAccessibleStores(clinics, ['vertical.comercio.view'])).toEqual([]);
  });

  it('respeita assignedStoreIds quando informado', () => {
    const result = filterAccessibleStores(clinics, ['vertical_access'], {
      assignedStoreIds: ['b'],
    });
    expect(result.map((s) => s.id)).toEqual(['b']);
  });
});
