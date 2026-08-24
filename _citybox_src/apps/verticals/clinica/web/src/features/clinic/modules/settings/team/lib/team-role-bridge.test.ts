import { describe, expect, it } from 'vitest';
import {
  STORE_PERMISSION_IDS,
  permissionsForRole,
} from '@citybox/clinica-permissions';
import {
  CLINIC_SERVICE_HOURS_API_ROLES,
  showsServiceHoursTabForApiRole,
} from './team-role-bridge';
import {
  createPermissionMapForRole,
  createPermissionMapFromIds,
  getTeamMemberPermissionSummary,
} from './team-member-permissions';
import {
  normalizeUsernamePart,
  suggestUsernameFromName,
  validateTeamMemberSheetForm,
} from './team-member-form-validation';
import { createEmptyTeamMemberFormData } from './team-form-initial-values';

describe('team-role-bridge', () => {
  it('exibe horários só para aluno, dentista_admin e dentista', () => {
    expect(showsServiceHoursTabForApiRole('aluno')).toBe(true);
    expect(showsServiceHoursTabForApiRole('dentista_admin')).toBe(true);
    expect(showsServiceHoursTabForApiRole('dentista')).toBe(true);
    expect(showsServiceHoursTabForApiRole('gerente')).toBe(false);
    expect(showsServiceHoursTabForApiRole('secretario')).toBe(false);
    expect(showsServiceHoursTabForApiRole('vendedor')).toBe(false);
    expect(CLINIC_SERVICE_HOURS_API_ROLES.size).toBe(3);
  });
});

describe('team-member-permissions', () => {
  it('deriva mapa CASL do cargo dentista_admin (todos os checkboxes)', () => {
    const map = createPermissionMapForRole('dentista_admin');
    expect(map.settings_team_create).toBe(true);
    expect(map.settings_manage).toBe(true);
    expect(map.patient_create).toBe(true);
    expect(map.schedule_view_menu).toBe(true);
    expect(map.sales_access).toBe(true);
    expect(map.stock_access).toBe(true);
    expect(map.marketing_campaign_create).toBe(true);
    expect(map.dashboard_indicators).toBe(true);
    expect(map.marketing_access).toBeUndefined();
    expect(map.vertical_access).toBeUndefined();
    expect(Object.values(map).filter(Boolean).length).toBe(
      STORE_PERMISSION_IDS.length,
    );
    expect(permissionsForRole('dentista_admin').length).toBe(
      STORE_PERMISSION_IDS.length,
    );
  });

  it('gerente não inclui agenda nem todos os checkboxes', () => {
    const map = createPermissionMapForRole('gerente');
    expect(map.schedule_view_menu).toBe(false);
    expect(map.settings_manage).toBe(true);
    expect(map.sales_access).toBe(true);
    expect(map.patient_evolution_update).toBe(false);
    expect(map.patient_file_delete).toBe(false);
  });

  it('não reativa estoque só porque settings_manage está presente', () => {
    const map = createPermissionMapFromIds(['settings_manage']);
    expect(map.settings_manage).toBe(true);
    expect(map.stock_access).toBe(false);
  });

  it('resumo de permissões expande aliases e usa total do catálogo fino', () => {
    const summary = getTeamMemberPermissionSummary([
      'settings_team_create',
      'patients_manage',
      'schedule_manage',
    ]);
    expect(summary.total).toBe(STORE_PERMISSION_IDS.length);
    expect(summary.granted).toBeGreaterThan(3);
    expect(getTeamMemberPermissionSummary([])).toEqual({
      granted: 0,
      total: STORE_PERMISSION_IDS.length,
    });
  });
});

describe('team-member-form-validation', () => {
  it('normaliza partes do username removendo acentos e caracteres inválidos', () => {
    expect(normalizeUsernamePart('José')).toBe('jose');
    expect(normalizeUsernamePart('  Ana-Clara  ')).toBe('ana-clara');
  });

  it('sugere username a partir de primeiro e último nome', () => {
    expect(suggestUsernameFromName('Bruno', 'Arouca')).toBe('bruno.arouca');
    expect(suggestUsernameFromName('Ana', '')).toBe('ana');
  });

  it('valida campos obrigatórios e e-mail opcional', () => {
    const empty = validateTeamMemberSheetForm(createEmptyTeamMemberFormData());
    expect(empty.firstName).toBeDefined();
    expect(empty.lastName).toBeDefined();
    expect(empty.username).toBeDefined();
    expect(empty.role).toBeDefined();
    expect(empty.email).toBeUndefined();

    const invalidEmail = validateTeamMemberSheetForm({
      ...createEmptyTeamMemberFormData(),
      firstName: 'Maria',
      lastName: 'Silva',
      username: 'maria.silva',
      email: 'invalido',
      role: 'gerente',
    });
    expect(invalidEmail.email).toBe('E-mail inválido.');

    const valid = validateTeamMemberSheetForm({
      ...createEmptyTeamMemberFormData(),
      firstName: 'Maria',
      lastName: 'Silva',
      username: 'maria.silva',
      email: '',
      role: 'gerente',
    });
    expect(Object.keys(valid)).toHaveLength(0);
  });
});
