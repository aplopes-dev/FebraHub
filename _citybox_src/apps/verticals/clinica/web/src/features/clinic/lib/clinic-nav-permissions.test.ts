import { describe, expect, it } from 'vitest';
import { createClinicNavPermissions } from './clinic-nav-permissions';
import { CLINIC_NAV_MODULES } from './navigation';
import {
  canAccessClinicProfileSettings,
  firstAllowedSettingsPath,
} from './clinic-settings-access';

const nav = createClinicNavPermissions();

describe('createClinicNavPermissions', () => {
  it('Agenda no sidebar só com schedule_view_menu', () => {
    const withoutMenu = nav.filterNavModules(CLINIC_NAV_MODULES, [
      'schedule_attend',
      'schedule_view_all',
      'schedule_create_for_others',
      'schedule_delete',
      'vertical_access',
    ]);
    expect(
      withoutMenu.find((m) => m.id === 'clinica')?.children.map((c) => c.id),
    ).not.toContain('agenda');
    expect(
      nav.canAccessPath('/agenda', CLINIC_NAV_MODULES, [
        'schedule_attend',
        'vertical_access',
      ]),
    ).toBe(false);

    const withMenu = nav.filterNavModules(CLINIC_NAV_MODULES, [
      'schedule_view_menu',
      'vertical_access',
    ]);
    expect(
      withMenu.find((m) => m.id === 'clinica')?.children.map((c) => c.id),
    ).toContain('agenda');
  });

  it('mostra Pacientes mesmo sem checkboxes da ficha; bloqueia só a ficha', () => {
    const permissions = [
      'dashboard_indicators',
      'schedule_view_menu',
      'vertical_access',
    ];
    const modules = nav.filterNavModules(CLINIC_NAV_MODULES, permissions);

    const clinica = modules.find((m) => m.id === 'clinica');
    expect(clinica?.children.map((c) => c.id)).toEqual([
      'visao-geral',
      'pacientes',
      'agenda',
      'loja',
    ]);
    expect(
      nav.canAccessPath('/pacientes', CLINIC_NAV_MODULES, permissions),
    ).toBe(true);
    expect(
      nav.canAccessPath('/pacientes/abc/sobre', CLINIC_NAV_MODULES, permissions),
    ).toBe(false);
  });

  it('Dashboard: indicadores/relatórios vs tarefas', () => {
    const indicators = ['dashboard_indicators', 'vertical_access'];
    expect(nav.canAccessPath('/', CLINIC_NAV_MODULES, indicators)).toBe(true);
    expect(
      nav.canAccessPath('/relatorios', CLINIC_NAV_MODULES, indicators),
    ).toBe(true);
    expect(nav.canAccessPath('/tarefas', CLINIC_NAV_MODULES, indicators)).toBe(
      false,
    );

    const tasks = ['dashboard_tasks', 'vertical_access'];
    expect(nav.canAccessPath('/tarefas', CLINIC_NAV_MODULES, tasks)).toBe(true);
    expect(nav.canAccessPath('/', CLINIC_NAV_MODULES, tasks)).toBe(false);
    const modules = nav.filterNavModules(CLINIC_NAV_MODULES, tasks);
    const leaf = modules
      .find((m) => m.id === 'clinica')
      ?.children.find((c) => c.id === 'visao-geral');
    expect(leaf?.path).toBe('/tarefas');
  });

  it('financial_summary sozinho não abre Visão geral', () => {
    const permissions = ['financial_summary', 'vertical_access'];
    const clinica = nav
      .filterNavModules(CLINIC_NAV_MODULES, permissions)
      .find((m) => m.id === 'clinica');
    expect(clinica?.children.map((c) => c.id)).not.toContain('visao-geral');
    expect(nav.canAccessPath('/', CLINIC_NAV_MODULES, permissions)).toBe(false);
  });

  it('libera ficha com patient_read_personal', () => {
    const permissions = ['patient_read_personal', 'vertical_access'];
    expect(
      nav.canAccessPath('/pacientes/abc/sobre', CLINIC_NAV_MODULES, permissions),
    ).toBe(true);
  });

  it('bloqueia ficha com orçamentos/CRUD sem visualizar dados pessoais', () => {
    const permissions = [
      'patient_budget_read',
      'patient_create',
      'patient_update_personal',
      'vertical_access',
    ];
    expect(
      nav.canAccessPath('/pacientes/abc/sobre', CLINIC_NAV_MODULES, permissions),
    ).toBe(false);
    expect(
      nav.canAccessPath('/pacientes', CLINIC_NAV_MODULES, permissions),
    ).toBe(true);
  });

  it('mostra Pacientes com patient_read_personal e Vendas com sales_access', () => {
    const modules = nav.filterNavModules(CLINIC_NAV_MODULES, [
      'patient_read_personal',
      'sales_access',
      'marketing_campaign_read',
      'stock_access',
      'vertical_access',
    ]);
    const clinica = modules.find((m) => m.id === 'clinica');
    expect(clinica?.children.map((c) => c.id)).toEqual(
      expect.arrayContaining(['pacientes', 'vendas', 'marketing']),
    );
    const admin = modules.find((m) => m.id === 'administrativo');
    expect(admin?.children.map((c) => c.id)).toContain('estoque');
  });

  it('expande alias patients_manage no menu', () => {
    const modules = nav.filterNavModules(CLINIC_NAV_MODULES, [
      'patients_manage',
      'vertical_access',
    ]);
    const clinica = modules.find((m) => m.id === 'clinica');
    expect(clinica?.children.map((c) => c.id)).toContain('pacientes');
  });

  it('mostra Configurações mesmo sem checkboxes de settings', () => {
    const modules = nav.filterNavModules(CLINIC_NAV_MODULES, [
      'financial_summary',
      'vertical_access',
    ]);
    const admin = modules.find((m) => m.id === 'administrativo');
    expect(admin?.children.map((c) => c.id)).toContain('configuracoes');
    const leaf = admin?.children.find((c) => c.id === 'configuracoes');
    expect(leaf?.path).toBe('/configuracoes/equipe');
  });

  it('sem settings_manage: sidebar Configurações aponta para Equipe', () => {
    const modules = nav.filterNavModules(CLINIC_NAV_MODULES, [
      'settings_team_create',
      'vertical_access',
    ]);
    const leaf = modules
      .find((m) => m.id === 'administrativo')
      ?.children.find((c) => c.id === 'configuracoes');
    expect(leaf?.path).toBe('/configuracoes/equipe');
  });

  it('com settings_manage: permite /configuracoes e path do sidebar fica na Clínica', () => {
    const permissions = ['settings_manage', 'vertical_access'];
    expect(
      nav.canAccessPath('/configuracoes', CLINIC_NAV_MODULES, permissions),
    ).toBe(true);
    const modules = nav.filterNavModules(CLINIC_NAV_MODULES, permissions);
    const leaf = modules
      .find((m) => m.id === 'administrativo')
      ?.children.find((c) => c.id === 'configuracoes');
    expect(leaf?.path).toBe('/configuracoes');
  });

  it('sem settings_manage: bloqueia tela /configuracoes mas libera /equipe', () => {
    const permissions = ['settings_team_create', 'vertical_access'];
    expect(
      nav.canAccessPath('/configuracoes', CLINIC_NAV_MODULES, permissions),
    ).toBe(false);
    expect(
      nav.canAccessPath('/configuracoes/equipe', CLINIC_NAV_MODULES, permissions),
    ).toBe(true);
  });

  it('Financeiro no sidebar exige view (resumo sozinho não abre)', () => {
    const summaryOnly = ['financial_summary', 'vertical_access'];
    const adminSummary = nav
      .filterNavModules(CLINIC_NAV_MODULES, summaryOnly)
      .find((m) => m.id === 'administrativo');
    expect(adminSummary?.children.map((c) => c.id)).not.toContain('financeiro');
    expect(
      nav.canAccessPath('/financeiro', CLINIC_NAV_MODULES, summaryOnly),
    ).toBe(false);

    const withView = [
      'financial_income_view',
      'financial_summary',
      'vertical_access',
    ];
    const adminView = nav
      .filterNavModules(CLINIC_NAV_MODULES, withView)
      .find((m) => m.id === 'administrativo');
    expect(adminView?.children.map((c) => c.id)).toContain('financeiro');
    expect(
      nav.canAccessPath('/financeiro', CLINIC_NAV_MODULES, withView),
    ).toBe(true);
  });

  it('bloqueia abas de Configurações sem o checkbox correspondente', () => {
    const permissions = ['financial_summary', 'vertical_access'];
    expect(
      nav.canAccessPath('/configuracoes/planos', CLINIC_NAV_MODULES, permissions),
    ).toBe(false);
    expect(
      nav.canAccessPath('/configuracoes/equipe', CLINIC_NAV_MODULES, permissions),
    ).toBe(true);
  });

  it('Equipe sem settings_team_*: acesso read-only (sem write)', () => {
    const permissions = ['financial_summary', 'vertical_access'];
    expect(
      nav.canAccessPath('/configuracoes/equipe', CLINIC_NAV_MODULES, permissions),
    ).toBe(true);
    expect(
      nav.canWritePath('/configuracoes/equipe', CLINIC_NAV_MODULES, permissions),
    ).toBe(false);
  });

  it('sem permissões não lista módulos', () => {
    expect(nav.filterNavModules(CLINIC_NAV_MODULES, [])).toEqual([]);
  });
});

describe('clinic-settings-access', () => {
  it('liga tela Clínica ao checkbox settings_manage', () => {
    expect(canAccessClinicProfileSettings(['settings_manage'])).toBe(true);
    expect(canAccessClinicProfileSettings(['settings_team_create'])).toBe(false);
    expect(firstAllowedSettingsPath(['settings_team_update'])).toBe(
      '/configuracoes/equipe',
    );
  });

  it('sem permissões de settings: fallback permanente é Equipe', () => {
    expect(firstAllowedSettingsPath([])).toBe('/configuracoes/equipe');
    expect(firstAllowedSettingsPath(['financial_summary'])).toBe(
      '/configuracoes/equipe',
    );
  });
});
