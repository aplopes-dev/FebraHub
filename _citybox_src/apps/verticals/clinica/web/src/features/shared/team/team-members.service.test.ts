import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createTeamMember,
  deleteTeamMember,
  listTeamMembers,
  listTeamRoles,
  resetTeamMemberPassword,
  updateTeamMember,
  updateTeamMemberStatus,
} from './team-members.service';
import * as authFetch from '@/lib/auth-fetch';

/** Desde a Fase 3 o `storeId` da loja ativa É o `clinicId`. */
const CLINIC_ID = 'clinic-1';

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
    json: async () => body,
  } as Response;
}

function memberDto(overrides: Record<string, unknown> = {}) {
  return {
    id: 'member-1',
    username: 'maria.silva',
    email: null,
    firstName: 'Maria',
    lastName: 'Silva',
    status: 'active',
    hasPassword: true,
    provisionalExpiresAt: null,
    disabledAt: null,
    clinics: [
      {
        clinicId: CLINIC_ID,
        clinicName: 'Clínica Centro',
        role: 'dentista',
        roleLabel: 'Dentista',
        permissions: ['patients_manage', 'schedule_manage'],
      },
    ],
    ...overrides,
  };
}

describe('team-members.service', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lista membros da clinica-api e deriva name + status', async () => {
    vi.spyOn(authFetch, 'fetchWithSession').mockResolvedValue(
      jsonResponse({
        items: [
          memberDto(),
          memberDto({
            id: 'member-2',
            firstName: 'João',
            lastName: 'Souza',
            hasPassword: false,
          }),
        ],
      }),
    );

    const members = await listTeamMembers(CLINIC_ID);

    expect(authFetch.fetchWithSession).toHaveBeenCalledWith(
      '/api/proxy/clinica/v1/members',
      expect.anything(),
    );
    expect(members[0]).toMatchObject({
      name: 'Maria Silva',
      status: 'active',
      role: 'dentista',
      roleLabel: 'Dentista',
    });
    expect(members[1]).toMatchObject({ name: 'João Souza', status: 'pending' });
  });

  it('marca membros demo do seed mesmo sem isDemoSeedMember na API', async () => {
    const storeId = '705fb230-f40f-4f19-8da7-231b14983b80';
    vi.spyOn(authFetch, 'fetchWithSession').mockResolvedValue(
      jsonResponse({
        items: [
          memberDto({
            id: 'demo-1',
            username: 'dentista.705fb230',
            firstName: 'Fisioterapeuta',
            lastName: 'Demo',
            email: 'dentista.705fb230@seed.citybox.local',
            hasPassword: false,
            role: 'dentista',
            clinics: [
              {
                clinicId: storeId,
                clinicName: 'Clínica Fisio',
                role: 'dentista',
                roleLabel: 'Fisioterapeuta',
                permissions: ['patients_manage'],
              },
            ],
          }),
        ],
      }),
    );

    const members = await listTeamMembers(storeId);

    expect(members[0]?.isDemoSeedMember).toBe(true);
  });

  it('usa o vínculo da clínica ATIVA em membro multi-clínica', async () => {
    // Um membro pode ser gerente na matriz e auxiliar na filial. A tela é por clínica,
    // então pegar `clinics[0]` mostraria o papel da unidade errada.
    vi.spyOn(authFetch, 'fetchWithSession').mockResolvedValue(
      jsonResponse({
        items: [
          memberDto({
            clinics: [
              {
                clinicId: 'clinic-outra',
                clinicName: 'Filial',
                role: 'gerente',
                roleLabel: 'Gerente',
                permissions: ['settings_manage', 'settings_team'],
              },
              {
                clinicId: CLINIC_ID,
                clinicName: 'Clínica Centro',
                role: 'auxiliar',
                roleLabel: 'Auxiliar',
                permissions: ['schedule_manage'],
              },
            ],
          }),
        ],
      }),
    );

    const [member] = await listTeamMembers(CLINIC_ID);

    expect(member.role).toBe('auxiliar');
    expect(member.permissions).toEqual(['schedule_manage']);
  });

  it('lista os cargos da vertical clínica', async () => {
    vi.spyOn(authFetch, 'fetchWithSession').mockResolvedValue(
      jsonResponse({ items: [{ key: 'gerente', label: 'Gerente' }] }),
    );

    const roles = await listTeamRoles(CLINIC_ID);

    expect(authFetch.fetchWithSession).toHaveBeenCalledWith(
      '/api/proxy/clinica/v1/members/roles',
      expect.anything(),
    );
    expect(roles).toEqual([{ roleKey: 'gerente', label: 'Gerente' }]);
  });

  it('cria membro com vínculo na clínica ativa e username normalizado', async () => {
    const spy = vi
      .spyOn(authFetch, 'fetchWithSession')
      .mockResolvedValue(
        jsonResponse({ ...memberDto(), provisionalPassword: 'AB12CD34' }),
      );

    const result = await createTeamMember(CLINIC_ID, {
      firstName: 'Maria',
      lastName: 'Silva',
      username: 'Maria.Silva',
      email: '',
      role: 'dentista',
      permissions: ['patients_manage', 'schedule_manage'],
    });

    expect(result.temporaryPassword).toBe('AB12CD34');
    expect(result.member.username).toBe('maria.silva');

    const [url, init] = spy.mock.calls[0];
    expect(url).toBe('/api/proxy/clinica/v1/members');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(init?.body as string)).toEqual({
      firstName: 'Maria',
      lastName: 'Silva',
      username: 'maria.silva',
      clinics: [
        {
          clinicId: CLINIC_ID,
          role: 'dentista',
          permissions: ['patients_manage', 'schedule_manage'],
        },
      ],
    });
  });

  it('envia X-Store-Id com a clínica ativa', async () => {
    const spy = vi
      .spyOn(authFetch, 'fetchWithSession')
      .mockResolvedValue(jsonResponse({ items: [] }));

    await listTeamMembers(CLINIC_ID);

    const [, init] = spy.mock.calls[0];
    // É o header que o ClinicScopeGuard usa para resolver organização + vínculo.
    expect(new Headers(init?.headers).get('X-Store-Id')).toBe(CLINIC_ID);
  });

  it('atualiza membro via PUT reescrevendo o escopo de clínicas', async () => {
    const spy = vi
      .spyOn(authFetch, 'fetchWithSession')
      .mockResolvedValue(
        jsonResponse(
          memberDto({
            clinics: [
              {
                clinicId: CLINIC_ID,
                clinicName: 'Clínica Centro',
                role: 'gerente',
                roleLabel: 'Gerente',
                permissions: [],
              },
            ],
          }),
        ),
      );

    const member = await updateTeamMember(CLINIC_ID, 'member-1', {
      firstName: 'Maria',
      lastName: 'Silva',
      username: 'maria.silva',
      email: '',
      role: 'gerente',
      permissions: ['settings_manage', 'patients_manage'],
    });

    const [url, init] = spy.mock.calls[0];
    expect(url).toBe('/api/proxy/clinica/v1/members/member-1');
    expect(init?.method).toBe('PUT');
    expect(JSON.parse(init?.body as string).clinics).toEqual([
      {
        clinicId: CLINIC_ID,
        role: 'gerente',
        permissions: ['settings_manage', 'patients_manage'],
      },
    ]);
    expect(member.role).toBe('gerente');
  });

  it('traduz status inactive da UI para disabled da API', async () => {
    const spy = vi
      .spyOn(authFetch, 'fetchWithSession')
      .mockResolvedValue(jsonResponse({ ok: true }));

    await updateTeamMemberStatus(CLINIC_ID, 'member-1', 'inactive');

    const [url, init] = spy.mock.calls[0];
    expect(url).toBe('/api/proxy/clinica/v1/members/member-1/status');
    expect(init?.method).toBe('PATCH');
    expect(JSON.parse(init?.body as string)).toEqual({ status: 'disabled' });
  });

  it('reseta a senha gerando nova provisória', async () => {
    const spy = vi.spyOn(authFetch, 'fetchWithSession').mockResolvedValue(
      jsonResponse({ username: 'maria.silva', provisionalPassword: 'NEW98765' }),
    );

    const result = await resetTeamMemberPassword(CLINIC_ID, 'member-1');

    const [url, init] = spy.mock.calls[0];
    expect(url).toBe('/api/proxy/clinica/v1/members/member-1/reset-password');
    expect(init?.method).toBe('POST');
    expect(result).toEqual({
      username: 'maria.silva',
      temporaryPassword: 'NEW98765',
    });
  });

  it('remove membro via DELETE', async () => {
    const spy = vi
      .spyOn(authFetch, 'fetchWithSession')
      .mockResolvedValue(jsonResponse({ ok: true }));

    await deleteTeamMember(CLINIC_ID, 'member-1');

    const [url, init] = spy.mock.calls[0];
    expect(url).toBe('/api/proxy/clinica/v1/members/member-1');
    expect(init?.method).toBe('DELETE');
  });

  it('propaga ClinicaApiError com a mensagem da API', async () => {
    vi.spyOn(authFetch, 'fetchWithSession').mockResolvedValue(
      jsonResponse({ message: 'Este usuário já faz parte desta organização' }, 400),
    );

    await expect(
      createTeamMember(CLINIC_ID, {
        firstName: 'Maria',
        lastName: 'Silva',
        username: 'maria.silva',
        email: '',
        role: 'dentista',
      }),
    ).rejects.toMatchObject({
      name: 'ClinicaApiError',
      status: 400,
      message: 'Este usuário já faz parte desta organização',
    });
  });
});
