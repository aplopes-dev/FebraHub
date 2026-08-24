import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  HELP_MODULES,
  HELP_SUPPORT_CHANNELS,
  visibleHelpModules,
  type HelpModuleId,
} from './help-content';

const EXPECTED_MODULE_IDS: readonly HelpModuleId[] = [
  'dashboard',
  'leads',
  'properties',
  'transactions',
  'finance',
  'calendar',
  'settings',
  'catalog',
];

const ALLOWED_NAV_HREFS = new Set([
  '/',
  '/leads',
  '/properties',
  '/transactions',
  '/transactions/finance',
  '/calendar',
  '/settings',
]);

describe('HELP_MODULES', () => {
  it('has unique ids in the documented order', () => {
    const ids = HELP_MODULES.map((module) => module.id);
    assert.deepEqual(ids, [...EXPECTED_MODULE_IDS]);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('only uses known navHref values when present', () => {
    for (const module of HELP_MODULES) {
      if (module.navHref) {
        assert.ok(
          ALLOWED_NAV_HREFS.has(module.navHref),
          `unexpected navHref ${module.navHref} on ${module.id}`,
        );
      }
    }
  });
});

describe('HELP_SUPPORT_CHANNELS', () => {
  it('exposes whatsapp, phone and status', () => {
    assert.deepEqual(
      HELP_SUPPORT_CHANNELS.map((channel) => channel.id),
      ['whatsapp', 'phone', 'status'],
    );
  });
});

describe('visibleHelpModules', () => {
  it('hides modules whose navHref the user cannot open', () => {
    const visible = visibleHelpModules(
      HELP_MODULES,
      (href) => href !== '/transactions/finance',
    );
    const ids = visible.map((module) => module.id);
    assert.ok(!ids.includes('finance'));
    assert.ok(ids.includes('leads'));
    assert.ok(ids.includes('catalog'));
  });
});
