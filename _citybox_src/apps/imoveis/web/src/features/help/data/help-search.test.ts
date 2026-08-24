import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { HELP_FAQS } from './faq-data';
import { HELP_MODULES } from './help-content';
import { filterFaqs, filterHelpCatalog } from './help-search';

describe('filterHelpCatalog', () => {
  it('returns the full catalog when the query is empty', () => {
    const result = filterHelpCatalog('  ', {
      modules: HELP_MODULES,
      faqs: HELP_FAQS,
    });
    assert.equal(result.modules.length, HELP_MODULES.length);
    assert.equal(result.faqs.length, HELP_FAQS.length);
  });

  it('filters modules and FAQs by keyword', () => {
    const kanban = filterHelpCatalog('kanban', {
      modules: HELP_MODULES,
      faqs: HELP_FAQS,
    });
    assert.ok(kanban.modules.some((module) => module.id === 'leads'));
    assert.ok(kanban.faqs.some((item) => item.id === 'faq-kanban'));
    assert.ok(!kanban.modules.some((module) => module.id === 'calendar'));
  });

  it('matches DRE in finance FAQ and module', () => {
    const dre = filterHelpCatalog('dre', {
      modules: HELP_MODULES,
      faqs: HELP_FAQS,
    });
    assert.ok(dre.modules.some((module) => module.id === 'finance'));
    assert.ok(dre.faqs.some((item) => item.category === 'finance'));
  });

  it('matches FAQ tags that are not in the question', () => {
    const lentidao = filterHelpCatalog('lentidao', {
      modules: HELP_MODULES,
      faqs: HELP_FAQS,
    });
    assert.ok(lentidao.faqs.some((item) => item.tags.includes('lentidao')));
  });
});

describe('filterFaqs', () => {
  it('combines category and query', () => {
    const nota = filterFaqs(HELP_FAQS, { query: 'nota fiscal', category: 'finance' });
    assert.ok(nota.length > 0);
    assert.ok(nota.every((item) => item.category === 'finance'));

    const empty = filterFaqs(HELP_FAQS, { query: 'kanban', category: 'finance' });
    assert.equal(empty.length, 0);
  });
});
