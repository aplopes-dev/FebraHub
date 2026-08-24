import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchMyStores, StoresApiError } from './stores-api';
import * as authFetch from './auth-fetch';

function accessResponse(overrides: Record<string, unknown> = {}) {
  return {
    member: { id: 'member-1', status: 'active' },
    organization: {
      id: 'org-1',
      storeId: 'clinic-1',
      name: 'Odonto Ilhéus',
      status: 'active',
    },
    clinics: [
      {
        clinicId: 'clinic-1',
        clinicName: 'Clínica Centro',
        role: 'dentista',
        permissions: ['patients_manage'],
      },
    ],
    ...overrides,
  };
}

describe('fetchMyStores', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('consulta a clinica-api (sem passar pelo platform-api) e mapeia clínicas', async () => {
    vi.spyOn(authFetch, 'fetchWithSession').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => accessResponse(),
    } as Response);

    const stores = await fetchMyStores();

    expect(authFetch.fetchWithSession).toHaveBeenCalledWith(
      '/api/proxy/clinica/v1/members/me',
      { headers: { 'Content-Type': 'application/json' } },
    );
    expect(stores).toEqual([
      {
        id: 'clinic-1',
        name: 'Clínica Centro',
        slug: 'clinic-1',
        vertical: 'clinic',
        permissions: ['patients_manage'],
        isOrganizationOwner: false,
        memberId: 'member-1',
      },
    ]);
  });

  it('lista todas as clínicas de uma organização multi-clínica', async () => {
    vi.spyOn(authFetch, 'fetchWithSession').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () =>
        accessResponse({
          clinics: [
            {
              clinicId: 'clinic-1',
              clinicName: 'Matriz',
              role: 'gerente',
              permissions: [],
            },
            {
              clinicId: 'clinic-2',
              clinicName: 'Filial Pontal',
              role: 'auxiliar',
              permissions: [],
            },
          ],
        }),
    } as Response);

    const stores = await fetchMyStores();

    expect(stores.map((s) => s.id)).toEqual(['clinic-1', 'clinic-2']);
  });

  it('mantém a clínica na lista quando a organização está suspensa', async () => {
    // Sumir da lista pareceria conta inexistente. Quem bloqueia é o ClinicScopeGuard,
    // com a mensagem acionável sobre regularizar o pagamento.
    vi.spyOn(authFetch, 'fetchWithSession').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () =>
        accessResponse({
          organization: {
            id: 'org-1',
            storeId: 'clinic-1',
            name: 'Odonto Ilhéus',
            status: 'suspended',
          },
        }),
    } as Response);

    await expect(fetchMyStores()).resolves.toHaveLength(1);
  });

  it('devolve lista vazia quando o usuário não é membro de nenhuma organização', async () => {
    vi.spyOn(authFetch, 'fetchWithSession').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () =>
        accessResponse({ member: null, organization: null, clinics: [] }),
    } as Response);

    await expect(fetchMyStores()).resolves.toEqual([]);
  });

  it('lança StoresApiError 401 quando sessão inválida', async () => {
    vi.spyOn(authFetch, 'fetchWithSession').mockResolvedValue({
      ok: false,
      status: 401,
    } as Response);

    await expect(fetchMyStores()).rejects.toMatchObject({
      name: 'StoresApiError',
      status: 401,
      message: 'Sessão expirada ou inválida',
    });
  });

  it('propaga status de erro upstream', async () => {
    vi.spyOn(authFetch, 'fetchWithSession').mockResolvedValue({
      ok: false,
      status: 503,
    } as Response);

    await expect(fetchMyStores()).rejects.toBeInstanceOf(StoresApiError);
    await expect(fetchMyStores()).rejects.toMatchObject({ status: 503 });
  });
});
