/**
 * Testa a função pura de preview do checkout (computePreview), se existir.
 * O módulo src/checkout/ é implementado por outra frente; enquanto não existir
 * (ou não exportar computePreview), os testes são pulados via t.skip.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

type PreviewInput = {
  subtotal: number;
  shipping: number;
  coupon?: { type: 'PERCENT' | 'FIXED'; value: number } | null;
  paymentType?: 'PIX' | 'CARD' | 'BOLETO' | null;
  hasAddress?: boolean;
  hasShippingOption?: boolean;
};

type PreviewResult = {
  subtotal: number;
  shipping: number;
  couponDiscount: number;
  pixDiscount: number;
  total: number;
  canConfirm?: boolean;
};

type ComputePreview = (input: PreviewInput) => PreviewResult;

async function loadComputePreview(): Promise<ComputePreview | null> {
  const candidates = [
    '../src/checkout/preview.js',
    '../src/checkout/checkout-preview.js',
    '../src/checkout/checkout.logic.js',
    '../src/checkout/checkout.service.js',
  ];
  for (const path of candidates) {
    try {
      const mod = (await import(path)) as Record<string, unknown>;
      if (typeof mod.computePreview === 'function') {
        return mod.computePreview as ComputePreview;
      }
    } catch {
      // módulo ainda não existe — tenta o próximo
    }
  }
  return null;
}

test('checkout preview — desconto PIX aplicado só quando paymentType=PIX', async (t) => {
  const computePreview = await loadComputePreview();
  if (!computePreview) return t.skip('src/checkout/computePreview ainda não existe');

  const base: PreviewInput = {
    subtotal: 100,
    shipping: 10,
    hasAddress: true,
    hasShippingOption: true,
  };
  const withPix = computePreview({ ...base, paymentType: 'PIX' });
  const withCard = computePreview({ ...base, paymentType: 'CARD' });

  assert.ok(withPix.pixDiscount > 0, 'PIX deve gerar desconto');
  assert.equal(withCard.pixDiscount, 0, 'CARD não tem desconto PIX');
  assert.ok(withPix.total < withCard.total);
});

test('checkout preview — cupom PERCENT desconta percentual do subtotal', async (t) => {
  const computePreview = await loadComputePreview();
  if (!computePreview) return t.skip('src/checkout/computePreview ainda não existe');

  const result = computePreview({
    subtotal: 200,
    shipping: 0,
    coupon: { type: 'PERCENT', value: 10 },
    paymentType: 'CARD',
    hasAddress: true,
    hasShippingOption: true,
  });
  assert.equal(result.couponDiscount, 20);
  assert.equal(result.total, 180);
});

test('checkout preview — cupom FIXED desconta valor absoluto', async (t) => {
  const computePreview = await loadComputePreview();
  if (!computePreview) return t.skip('src/checkout/computePreview ainda não existe');

  const result = computePreview({
    subtotal: 200,
    shipping: 10,
    coupon: { type: 'FIXED', value: 50 },
    paymentType: 'CARD',
    hasAddress: true,
    hasShippingOption: true,
  });
  assert.equal(result.couponDiscount, 50);
  assert.equal(result.total, 160);
});

test('checkout preview — canConfirm false sem endereço', async (t) => {
  const computePreview = await loadComputePreview();
  if (!computePreview) return t.skip('src/checkout/computePreview ainda não existe');

  const result = computePreview({
    subtotal: 100,
    shipping: 10,
    paymentType: 'PIX',
    hasAddress: false,
    hasShippingOption: true,
  });
  assert.equal(result.canConfirm, false);
});
