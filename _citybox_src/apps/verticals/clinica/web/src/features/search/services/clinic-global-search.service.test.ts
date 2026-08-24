import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CLINIC_NAV_MODULES } from '@/features/clinic/lib/navigation';
import { clinicGlobalSearchInternals } from '../services/clinic-global-search.service';

vi.mock('../services/clinic-search.api.service', () => ({
  searchClinicEntities: vi.fn(),
}));

import { searchClinicEntities } from '../services/clinic-search.api.service';
import { clinicGlobalSearch } from '../services/clinic-global-search.service';

const mockSearchClinicEntities = vi.mocked(searchClinicEntities);

const { navigationGroup, pagesGroup, hitMatchesQuery, MIN_REMOTE_QUERY_LENGTH } =
  clinicGlobalSearchInternals;

describe('clinic-global-search internals', () => {
  it('navigationGroup returns all leaves when query is empty', () => {
    const group = navigationGroup(CLINIC_NAV_MODULES, '', () => true);
    expect(group?.heading).toBe('Navegação');
    expect(group!.hits.length).toBeGreaterThan(0);
  });

  it('navigationGroup filters by query accent-insensitively', () => {
    const group = navigationGroup(CLINIC_NAV_MODULES, 'paciente', () => true);
    expect(group?.hits.some((hit) => hit.title === 'Pacientes')).toBe(true);
    expect(group?.hits.some((hit) => hit.title === 'Estoque')).toBe(false);
  });

  it('pagesGroup includes financeiro shortcuts', () => {
    const group = pagesGroup('fluxo', () => true);
    expect(group?.hits.some((hit) => hit.href.includes('/financeiro/fluxo'))).toBe(
      true,
    );
  });

  it('hitMatchesQuery uses keywords', () => {
    expect(
      hitMatchesQuery(
        {
          id: 'x',
          type: 'page',
          title: 'Foo',
          href: '/foo',
          keywords: ['whatsapp', 'mensagens'],
        },
        'whatsapp',
      ),
    ).toBe(true);
  });

  it('MIN_REMOTE_QUERY_LENGTH is 2', () => {
    expect(MIN_REMOTE_QUERY_LENGTH).toBe(2);
  });

  describe('clinicGlobalSearch remote FTS', () => {
    beforeEach(() => {
      mockSearchClinicEntities.mockReset();
    });

    it('calls search API once when query is long enough', async () => {
      mockSearchClinicEntities.mockResolvedValue({
        groups: [{ heading: 'Pacientes', hits: [{ id: 'patient-1', type: 'patient', title: 'Ana', href: '/pacientes/1/sobre' }] }],
      });

      const result = await clinicGlobalSearch('ana', CLINIC_NAV_MODULES, {
        storeId: 'store-1',
        canSearchPatients: true,
      });

      expect(mockSearchClinicEntities).toHaveBeenCalledWith('store-1', 'ana', {
        perType: 5,
      });
      expect(result.groups.some((g) => g.heading === 'Pacientes')).toBe(true);
    });

    it('does not call API when query is too short', async () => {
      await clinicGlobalSearch('a', CLINIC_NAV_MODULES, {
        storeId: 'store-1',
        canSearchPatients: true,
      });
      expect(mockSearchClinicEntities).not.toHaveBeenCalled();
    });

    it('returns nav only when API fails', async () => {
      mockSearchClinicEntities.mockRejectedValue(new Error('network'));

      const result = await clinicGlobalSearch('paciente', CLINIC_NAV_MODULES, {
        storeId: 'store-1',
        canAccessHref: () => true,
        canSearchPatients: true,
      });

      expect(result.groups.some((g) => g.heading === 'Navegação')).toBe(true);
      expect(result.groups.some((g) => g.heading === 'Pacientes')).toBe(false);
    });
  });
});
