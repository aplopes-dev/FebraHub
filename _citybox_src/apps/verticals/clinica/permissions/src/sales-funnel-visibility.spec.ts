import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  canViewAnySalesFunnel,
  canViewSalesFunnel,
  DEFAULT_SCHEDULE_FUNNEL_NAME,
  DEFAULT_SALES_FUNNEL_NAME,
  filterVisibleSalesFunnels,
} from './sales-funnel-visibility.js';

const schedule = {
  name: DEFAULT_SCHEDULE_FUNNEL_NAME,
  isDefault: true,
};
const sales = { name: DEFAULT_SALES_FUNNEL_NAME, isDefault: true };
const clinic = { name: 'Meu funil', isDefault: false };

describe('sales-funnel-visibility', () => {
  it('sales_access alone sees no funnels', () => {
    const perms = ['sales_access'];
    assert.equal(canViewSalesFunnel(schedule, perms), false);
    assert.equal(canViewSalesFunnel(sales, perms), false);
    assert.equal(canViewSalesFunnel(clinic, perms), false);
    assert.equal(canViewAnySalesFunnel(perms), false);
  });

  it('schedule checkbox only unlocks Funil de Agendamento', () => {
    const perms = ['sales_access', 'sales_view_funnel_schedule'];
    assert.equal(canViewSalesFunnel(schedule, perms), true);
    assert.equal(canViewSalesFunnel(sales, perms), false);
    assert.equal(canViewSalesFunnel(clinic, perms), false);
  });

  it('sales checkbox only unlocks Funil de Venda', () => {
    const perms = ['sales_view_funnel_sales'];
    assert.equal(canViewSalesFunnel(schedule, perms), false);
    assert.equal(canViewSalesFunnel(sales, perms), true);
    assert.equal(canViewSalesFunnel(clinic, perms), false);
  });

  it('clinic or custom checkbox unlocks non-default funnels', () => {
    assert.equal(
      canViewSalesFunnel(clinic, ['sales_view_clinic_funnels']),
      true,
    );
    assert.equal(
      canViewSalesFunnel(clinic, ['sales_view_funnel_custom']),
      true,
    );
    assert.equal(canViewSalesFunnel(schedule, ['sales_view_clinic_funnels']), false);
  });

  it('manage opportunities unlocks all funnels', () => {
    const perms = ['sales_manage_opportunities'];
    assert.equal(canViewSalesFunnel(schedule, perms), true);
    assert.equal(canViewSalesFunnel(sales, perms), true);
    assert.equal(canViewSalesFunnel(clinic, perms), true);
    assert.equal(canViewAnySalesFunnel(perms), true);
  });

  it('filterVisibleSalesFunnels keeps only allowed', () => {
    const visible = filterVisibleSalesFunnels(
      [schedule, sales, clinic],
      ['sales_view_funnel_schedule', 'sales_view_clinic_funnels'],
    );
    assert.deepEqual(
      visible.map((f) => f.name),
      [DEFAULT_SCHEDULE_FUNNEL_NAME, 'Meu funil'],
    );
  });
});
