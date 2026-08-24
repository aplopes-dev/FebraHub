import { permissionsForRole } from '@citybox/clinica-permissions';
import {
  DEMO_CLINIC_TEAM,
  demoClinicTeamPermissions,
  demoClinicTeamUsername,
  isDemoSeedMember,
  resolveDemoClinicTeamMemberNames,
  resolveMemberDisplayNames,
  sanitizeMemberPersonName,
} from './demo-clinic-team';

describe('demo-clinic-team', () => {
  const storeId = 'a1b2c3d4-1111-4111-8111-111111111111';

  it('seeda só dentista, gerente e secretário', () => {
    expect(DEMO_CLINIC_TEAM.map((d) => d.role)).toEqual([
      'dentista',
      'gerente',
      'secretario',
    ]);

    expect(demoClinicTeamUsername('secretario', storeId)).toBe(
      'secretario.a1b2c3d4',
    );
  });

  it('aplica o mesmo preset de permissionsForRole', () => {
    for (const demo of DEMO_CLINIC_TEAM) {
      expect(demoClinicTeamPermissions(demo.role)).toEqual(
        permissionsForRole(demo.role),
      );
    }
  });

  it('usa Fisioterapeuta Demo na vertente fisioterapia', () => {
    const professional = DEMO_CLINIC_TEAM.find((d) => d.role === 'dentista')!;
    expect(
      resolveDemoClinicTeamMemberNames(professional, 'fisioterapia'),
    ).toEqual({ firstName: 'Fisioterapeuta', lastName: 'Demo' });
    expect(
      resolveDemoClinicTeamMemberNames(professional, 'odontologia'),
    ).toEqual({ firstName: 'Dentista', lastName: 'Demo' });
  });

  it('identifica membros demo pelo username da loja', () => {
    const username = demoClinicTeamUsername('gerente', storeId);
    expect(
      isDemoSeedMember({
        username,
        storeId,
      }),
    ).toBe(true);
    expect(
      isDemoSeedMember({
        username,
        email: `${username}@seed.citybox.local`,
        storeId,
      }),
    ).toBe(true);
    expect(
      isDemoSeedMember({
        username: 'outro.usuario',
        email: 'outro@seed.citybox.local',
        storeId,
      }),
    ).toBe(false);
  });

  it('identifica demo pelo padrão de username + sobrenome Demo', () => {
    expect(
      isDemoSeedMember({
        username: 'gerente.deadbeef',
        lastName: 'Demo',
        storeId: '00000000-0000-0000-0000-000000000000',
      }),
    ).toBe(true);
  });

  it('corrige nome exibido do profissional demo mesmo com firstName legado', () => {
    const username = demoClinicTeamUsername('dentista', storeId);
    expect(
      resolveMemberDisplayNames(
        {
          username,
          firstName: 'Dentista',
          lastName: 'Demo',
          email: `${username}@seed.citybox.local`,
        },
        storeId,
        'fisioterapia',
      ),
    ).toEqual({ firstName: 'Fisioterapeuta', lastName: 'Demo' });
  });

  it('remove sobrenome placeholder legado', () => {
    expect(sanitizeMemberPersonName('Carlos', '-')).toEqual({
      firstName: 'Carlos',
      lastName: '',
    });
  });
});
