import {
  isCorePosModule,
  isKnownPosModule,
  POS_CORE_MODULE_IDS,
  POS_OPTIONAL_MODULES,
  POS_OPTIONAL_MODULE_IDS,
} from './pos-module.catalog';

/**
 * Contrato de módulos entre a API e o PDV.
 *
 * ⚠️ **Espelho de `module_catalog_contract_test.dart`** em
 * `apps/pdv/app/test/unit/`. As duas listas precisam bater, e não há como
 * compartilhá-las: um lado é TypeScript, o outro é Dart.
 *
 * **Este teste é a única defesa contra elas divergirem.** Módulo que entra ou
 * sai do catálogo muda os dois arquivos na mesma operação — senão o ERP oferece
 * uma chave que o app ignora, ou o app esconde uma tela que o ERP diz estar
 * ligada. Já aconteceu: `settings` estava no núcleo do app e faltava aqui.
 */
describe('Catálogo de módulos do PDV', () => {
  it('o núcleo é exatamente o do app', () => {
    expect([...POS_CORE_MODULE_IDS].sort()).toEqual(
      [
        'cash_drawer',
        'cash_hub',
        'counter',
        'credit',
        'customer',
        'history',
        'refund',
        'seller',
        'settings',
      ].sort(),
    );
  });

  it('os opcionais são as seis telas de segmento desta fatia', () => {
    expect([...POS_OPTIONAL_MODULE_IDS].sort()).toEqual(
      [
        'delivery',
        'delivery_orders',
        'price_check',
        'service',
        'tables',
        'tabs',
      ].sort(),
    );
  });

  it('núcleo e opcionais não se sobrepõem', () => {
    for (const id of POS_OPTIONAL_MODULE_IDS) {
      // Um opcional que também fosse núcleo viraria um switch sem efeito — a
      // resolução o forçaria a `available` de qualquer forma.
      expect(isCorePosModule(id)).toBe(false);
    }
  });

  it('todo opcional tem rótulo e descrição para a tela', () => {
    for (const item of POS_OPTIONAL_MODULES) {
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.description.length).toBeGreaterThan(0);
    }
  });

  it('id fora do catálogo não é reconhecido', () => {
    expect(isKnownPosModule('tables')).toBe(true);
    expect(isKnownPosModule('counter')).toBe(true);
    expect(isKnownPosModule('modulo_inventado')).toBe(false);
  });
});
