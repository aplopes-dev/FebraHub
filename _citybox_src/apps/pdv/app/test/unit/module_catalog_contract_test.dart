import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/features/modules/domain/module_ids.dart';
import 'package:citybox_pdv/features/modules/domain/pdv_module_definition.dart';
import 'package:citybox_pdv/features/modules/domain/pdv_module_enums.dart';

/// Contrato de módulos entre o PDV e a `erp-api`.
///
/// ⚠️ **Espelho de `pos-module.catalog.spec.ts`** em
/// `apps/erp/api/src/modules/pos-modules/domain/catalog/`. As duas listas
/// precisam bater, e não há como compartilhá-las: um lado é Dart, o outro é
/// TypeScript, e criar um pacote por causa de catorze strings custaria mais
/// que a duplicação.
///
/// **Este teste é a única defesa contra elas divergirem.** Se um módulo entrar
/// ou sair do catálogo, os dois arquivos mudam na mesma operação — senão o ERP
/// oferece uma chave que o app ignora, ou o app esconde uma tela que o ERP diz
/// estar ligada.
void main() {
  /// Os 9 que o backoffice **não** pode desligar.
  const Set<String> coreIds = <String>{
    PdvModuleIds.counter,
    PdvModuleIds.customer,
    PdvModuleIds.seller,
    PdvModuleIds.cashDrawer,
    PdvModuleIds.cashHub,
    PdvModuleIds.history,
    PdvModuleIds.refund,
    PdvModuleIds.credit,
    PdvModuleIds.settings,
  };

  /// Os 6 que o ERP oferece nesta fatia.
  const Set<String> configurableIds = <String>{
    PdvModuleIds.tables,
    PdvModuleIds.tabs,
    PdvModuleIds.service,
    PdvModuleIds.delivery,
    PdvModuleIds.deliveryOrders,
    PdvModuleIds.priceCheck,
  };

  test('o núcleo do app é exatamente o núcleo da API', () {
    final Set<String> appCore =
        pdvModuleCatalog
            .where((PdvModuleDefinition d) => d.isCore)
            .map((PdvModuleDefinition d) => d.id)
            .toSet();

    expect(appCore, coreIds);
  });

  test('todo módulo configurável existe no catálogo do app', () {
    final Set<String> known =
        pdvModuleCatalog.map((PdvModuleDefinition d) => d.id).toSet();

    // O ERP oferecendo uma chave que o app não conhece produziria um switch
    // sem efeito nenhum — o pior tipo de configuração.
    for (final String id in configurableIds) {
      expect(known, contains(id), reason: 'catálogo do app não tem "$id"');
    }
  });

  test('nenhum módulo configurável é de núcleo', () {
    for (final String id in configurableIds) {
      final PdvModuleDefinition? definition = findModuleDefinition(id);
      expect(
        definition?.isCore,
        isFalse,
        reason:
            '"$id" é oferecido pelo ERP mas o app o trata como núcleo — o '
            'switch não teria efeito',
      );
    }
  });

  test('os ids do app são as strings que viajam no JSON', () {
    // A serialização usa a string crua, não o índice do enum: renomear uma
    // constante Dart sem mudar o valor quebraria a leitura da resposta.
    expect(PdvModuleIds.tables, 'tables');
    expect(PdvModuleIds.tabs, 'tabs');
    expect(PdvModuleIds.service, 'service');
    expect(PdvModuleIds.delivery, 'delivery');
    expect(PdvModuleIds.deliveryOrders, 'delivery_orders');
    expect(PdvModuleIds.priceCheck, 'price_check');
    expect(PdvModuleIds.cashHub, 'cash_hub');
    expect(PdvModuleIds.cashDrawer, 'cash_drawer');
  });

  test('os três estados são os que a API envia', () {
    expect(
      PdvModuleState.values.map((PdvModuleState s) => s.name).toSet(),
      <String>{'available', 'disabled', 'blocked'},
    );
  });
}
