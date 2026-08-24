import { test } from 'node:test';
import assert from 'node:assert/strict';
import { money, moneyOrNull } from '../src/common/money.js';
import { toApiProduct, type ProductRow } from '../src/catalog/product.presenter.js';

/** Simula o Decimal do Prisma (Number() usa toString()). */
const decimalLike = (value: string) => ({ toString: () => value });

test('money arredonda para 2 casas decimais', () => {
  assert.equal(money(3.14159), 3.14);
  assert.equal(money(10.999), 11);
  assert.equal(money('19.9'), 19.9);
  assert.equal(money(0), 0);
});

test('money trata null/undefined como 0', () => {
  assert.equal(money(null), 0);
  assert.equal(money(undefined), 0);
});

test('moneyOrNull preserva null e converte valores', () => {
  assert.equal(moneyOrNull(null), null);
  assert.equal(moneyOrNull(undefined), null);
  assert.equal(moneyOrNull('45.004'), 45);
  assert.equal(moneyOrNull(12.5), 12.5);
});

test('toApiProduct converte Decimal-like e monta o shape ApiProduct', () => {
  const row: ProductRow = {
    id: 'p1',
    name: 'Smartphone Galaxy A55',
    imageUrl: 'https://example.com/p1.jpg',
    price: decimalLike('1799.90'),
    originalPrice: decimalLike('2199.00'),
    discountPercent: 18,
    rating: decimalLike('4.70'),
    reviewCount: 845,
    isFreeShipping: true,
    isExpress: true,
    brand: 'Samsung',
    specs: { tela: '6.6"' },
    categoryId: 'tecnologia',
    category: { id: 'tecnologia', name: 'Tecnologia' },
  };

  const api = toApiProduct(row);
  assert.equal(api.price, 1799.9);
  assert.equal(api.originalPrice, 2199);
  assert.equal(api.rating, 4.7);
  assert.equal(api.category, 'Tecnologia');
  assert.equal(api.categoryId, 'tecnologia');
  assert.equal(api.brand, 'Samsung');
  assert.deepEqual(api.specs, { tela: '6.6"' });
});

test('toApiProduct normaliza brand/specs/originalPrice ausentes', () => {
  const row: ProductRow = {
    id: 'p9',
    name: 'Café Torrado',
    imageUrl: '/img/p9.jpg',
    price: 18.9,
    originalPrice: null,
    discountPercent: null,
    rating: 4.6,
    reviewCount: 3120,
    isFreeShipping: false,
    isExpress: false,
    brand: null,
    specs: null,
    categoryId: 'supermercado',
    category: { id: 'supermercado', name: 'Mercado' },
  };

  const api = toApiProduct(row);
  assert.equal(api.originalPrice, null);
  assert.equal(api.brand, undefined);
  assert.equal(api.specs, undefined);
  assert.equal(api.price, 18.9);
});
