import { describe, expect, it } from 'vitest';
import type { TeamMember } from '@/features/shared/team';
import { filterAgendaProfessionals, isAgendaSchedulableMember } from './team';

function member(
  partial: Partial<TeamMember> & Pick<TeamMember, 'id' | 'role'>,
): TeamMember {
  return {
    id: partial.id,
    username: partial.username ?? partial.id,
    firstName: partial.firstName ?? 'Nome',
    lastName: partial.lastName ?? 'Sobrenome',
    name: partial.name ?? partial.id,
    email: partial.email,
    role: partial.role,
    roleLabel: partial.roleLabel ?? partial.role,
    permissions: partial.permissions ?? [],
    hasPassword: partial.hasPassword ?? true,
    status: partial.status ?? 'active',
  };
}

describe('isAgendaSchedulableMember', () => {
  it('aceita cargos com horário de atendimento', () => {
    expect(isAgendaSchedulableMember(member({ id: '1', role: 'dentista' }))).toBe(
      true,
    );
    expect(isAgendaSchedulableMember(member({ id: '2', role: 'aluno' }))).toBe(
      true,
    );
  });

  it('aceita outros cargos com schedule_attend', () => {
    expect(
      isAgendaSchedulableMember(
        member({
          id: 'g1',
          role: 'gerente',
          permissions: ['schedule_attend'],
        }),
      ),
    ).toBe(true);
  });

  it('aceita alias schedule_manage que expande para schedule_attend', () => {
    expect(
      isAgendaSchedulableMember(
        member({
          id: 'g2',
          role: 'gerente',
          permissions: ['schedule_manage'],
        }),
      ),
    ).toBe(true);
  });

  it('rejeita gerente/secretário sem fazer atendimentos', () => {
    expect(
      isAgendaSchedulableMember(
        member({ id: 'g3', role: 'gerente', permissions: ['settings_manage'] }),
      ),
    ).toBe(false);
    expect(
      isAgendaSchedulableMember(
        member({
          id: 's1',
          role: 'secretario',
          permissions: ['schedule_view_menu', 'schedule_view_all'],
        }),
      ),
    ).toBe(false);
  });
});

describe('filterAgendaProfessionals', () => {
  const members = [
    member({ id: 'a1', role: 'aluno', name: 'Aluno Ana' }),
    member({ id: 'd1', role: 'dentista', name: 'Dra. Beatriz' }),
    member({ id: 'da1', role: 'dentista_admin', name: 'Dr. Admin' }),
    member({ id: 'g1', role: 'gerente', name: 'Gerente Carla' }),
    member({
      id: 'g2',
      role: 'gerente',
      name: 'Gerente com agenda',
      permissions: ['schedule_attend', 'schedule_view_menu'],
    }),
    member({ id: 's1', role: 'secretario', name: 'Secretário' }),
    member({ id: 'd2', role: 'dentista', name: 'Dr. Dan', status: 'pending' }),
  ];

  it('mantém cargos com horários e membros com schedule_attend', () => {
    const result = filterAgendaProfessionals(members);
    expect(result.map((item) => item.id).sort()).toEqual([
      'a1',
      'd1',
      'd2',
      'da1',
      'g2',
    ]);
  });

  it('combina filtro de status com profissional agendável', () => {
    const result = filterAgendaProfessionals(members, { status: 'active' });
    expect(result.map((item) => item.id).sort()).toEqual([
      'a1',
      'd1',
      'da1',
      'g2',
    ]);
  });

  it('exclui gerente/secretário sem schedule_attend', () => {
    const result = filterAgendaProfessionals(members);
    expect(result.some((item) => item.id === 'g1')).toBe(false);
    expect(result.some((item) => item.role === 'secretario')).toBe(false);
  });
});
