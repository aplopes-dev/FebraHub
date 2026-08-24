import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { getActiveStoreId, registerActiveStoreId } from './store-bridge';

describe('store-bridge', () => {
  afterEach(() => {
    registerActiveStoreId(null);
  });

  it('getActiveStoreId devolve a loja registrada no mesmo turno (sem esperar effect)', () => {
    registerActiveStoreId('loja-real');
    assert.equal(getActiveStoreId(), 'loja-real');
  });

  it('sem loja registrada não usa um id inventado fora de development', () => {
    registerActiveStoreId(null);
    if (process.env.NODE_ENV === 'development') {
      const fallback =
        process.env.NEXT_PUBLIC_IMOVEIS_STORE_ID ?? 'dev-store-imoveis';
      assert.equal(getActiveStoreId(), fallback);
      return;
    }
    assert.throws(() => getActiveStoreId(), /Loja não selecionada/);
  });
});
