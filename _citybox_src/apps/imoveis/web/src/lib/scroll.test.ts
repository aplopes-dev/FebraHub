import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { nextScrollTopToAlign, PAGE_SCROLL_CLASS, PAGE_SCROLL_SELECTOR } from './scroll';

describe('scrollListToTop helpers', () => {
  it('PAGE_SCROLL_SELECTOR aponta a classe da casca', () => {
    assert.equal(PAGE_SCROLL_SELECTOR, '.imoveis-page-scroll');
    assert.match(PAGE_SCROLL_CLASS, /imoveis-page-scroll/);
  });

  it('nextScrollTopToAlign sobe o scroller até o alvo', () => {
    const scroller = {
      scrollTop: 800,
      getBoundingClientRect: () => ({ top: 100 }),
    };
    const target = {
      getBoundingClientRect: () => ({ top: 420 }),
    };

    assert.equal(nextScrollTopToAlign(scroller, target), 1120);
  });

  it('nextScrollTopToAlign não fica negativo', () => {
    const scroller = {
      scrollTop: 10,
      getBoundingClientRect: () => ({ top: 80 }),
    };
    const target = {
      getBoundingClientRect: () => ({ top: 20 }),
    };

    assert.equal(nextScrollTopToAlign(scroller, target), 0);
  });
});
