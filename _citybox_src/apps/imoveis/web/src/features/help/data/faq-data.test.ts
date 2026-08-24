import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  HELP_FAQS,
  HELP_FAQ_CATEGORY_ORDER,
  filterFaqsByCategory,
  visibleHelpFaqs,
} from './faq-data';

describe('HELP_FAQS', () => {
  it('has unique ids and the four product categories', () => {
    const ids = HELP_FAQS.map((item) => item.id);
    assert.equal(new Set(ids).size, ids.length);
    const categories = new Set(HELP_FAQS.map((item) => item.category));
    assert.deepEqual([...categories].sort(), [...HELP_FAQ_CATEGORY_ORDER].sort());
  });

  it('requires tags on every item', () => {
    for (const item of HELP_FAQS) {
      assert.ok(item.tags.length > 0, `${item.id} missing tags`);
    }
  });
});

describe('filterFaqsByCategory', () => {
  it('returns a copy of all items for all', () => {
    const all = filterFaqsByCategory(HELP_FAQS, 'all');
    assert.equal(all.length, HELP_FAQS.length);
    assert.ok(all !== HELP_FAQS);
  });

  it('keeps only finance items', () => {
    const finance = filterFaqsByCategory(HELP_FAQS, 'finance');
    assert.ok(finance.length > 0);
    assert.ok(finance.every((item) => item.category === 'finance'));
  });
});

describe('visibleHelpFaqs', () => {
  it('hides FAQs gated by navHref', () => {
    const visible = visibleHelpFaqs(HELP_FAQS, () => false);
    assert.ok(visible.every((item) => !item.navHref));
    assert.ok(visible.some((item) => item.id === 'faq-ticket'));
  });
});
