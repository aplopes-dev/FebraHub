import 'package:citybox_pdv/features/modules/domain/module_ids.dart';
import 'package:citybox_pdv/features/modules/domain/module_set_snapshot.dart';
import 'package:citybox_pdv/features/modules/domain/module_set_validator.dart';
import 'package:citybox_pdv/features/modules/domain/pdv_module_definition.dart';
import 'package:citybox_pdv/features/modules/domain/pdv_module_enums.dart';

/// Nomes estáveis dos perfis de fixture (FR-007).
abstract final class SegmentProfileNames {
  static const String restaurant = 'Restaurante';
  static const String snackWithDelivery = 'Lanchonete com delivery';
  static const String store = 'Loja';
  static const String market = 'Mercado';

  static const List<String> all = <String>[
    restaurant,
    snackWithDelivery,
    store,
    market,
  ];

  /// Perfil usado no primeiro start sem cache.
  static const String defaultProfile = restaurant;
}

/// Constrói o snapshot de um perfil nomeado.
///
/// Núcleo fica `available`, exceto crédito/devolução (`disabled` até existir
/// API no ERP — espelho de `resolveTerminalModules`).
ModuleSetSnapshot buildSegmentProfile(String name, {DateTime? updatedAt}) {
  final Set<String> enabledOptional = _optionalEnabledFor(name);
  final Map<String, PdvModuleState> states = <String, PdvModuleState>{
    for (final PdvModuleDefinition def in pdvModuleCatalog)
      def.id: def.isCore
          ? (ModuleSetValidator.allowsDisabledCore(def.id)
              ? PdvModuleState.disabled
              : PdvModuleState.available)
          : (enabledOptional.contains(def.id)
              ? PdvModuleState.available
              : PdvModuleState.disabled),
  };

  return ModuleSetValidator.ensureValid(
    ModuleSetSnapshot(
      states: states,
      profileName: name,
      updatedAt: updatedAt ?? DateTime.now(),
    ),
  );
}

Set<String> _optionalEnabledFor(String name) {
  // tables/tabs: desligados em todos os perfis até sync ERP + UX existirem
  // (espelho de `POS_TEMPORARILY_DISABLED_MODULE_IDS` / resolve no erp-api).
  const Set<String> foodScreens = <String>{
    PdvModuleIds.service,
    PdvModuleIds.delivery,
    PdvModuleIds.deliveryOrders,
  };
  const Set<String> foodBehaviors = <String>{
    PdvModuleIds.itemAddon,
    PdvModuleIds.kitchenNote,
    PdvModuleIds.halfPizza,
    PdvModuleIds.productionPrint,
    PdvModuleIds.serviceFee,
    PdvModuleIds.couvert,
  };
  const Set<String> retailBehaviors = <String>{
    PdvModuleIds.barcode,
    PdvModuleIds.scale,
    PdvModuleIds.variantGrid,
    PdvModuleIds.priceCheck,
  };

  switch (name) {
    case SegmentProfileNames.restaurant:
      return <String>{...foodScreens, ...foodBehaviors};
    case SegmentProfileNames.snackWithDelivery:
      return <String>{
        PdvModuleIds.service,
        PdvModuleIds.delivery,
        PdvModuleIds.deliveryOrders,
        ...foodBehaviors,
      };
    case SegmentProfileNames.store:
      return retailBehaviors;
    case SegmentProfileNames.market:
      return <String>{
        PdvModuleIds.barcode,
        PdvModuleIds.scale,
        PdvModuleIds.priceCheck,
      };
    default:
      return <String>{...foodScreens, ...foodBehaviors};
  }
}
