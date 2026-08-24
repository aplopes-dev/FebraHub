import 'package:citybox_pdv/features/modules/domain/module_ids.dart';
import 'package:citybox_pdv/features/modules/domain/module_set_snapshot.dart';
import 'package:citybox_pdv/features/modules/domain/pdv_module_definition.dart';
import 'package:citybox_pdv/features/modules/domain/pdv_module_enums.dart';

/// Valida / corrige um snapshot antes de o terminal operar.
///
/// Módulos de núcleo MUST permanecer [PdvModuleState.available] (FR-002),
/// **exceto** [serverForcedDisabledCore] — o ERP força `disabled` até existirem
/// APIs de crédito/devolução; o cliente espelha essa exceção.
abstract final class ModuleSetValidator {
  /// Núcleo que o servidor pode manter `disabled`/`blocked` (sem API ainda).
  static const Set<String> serverForcedDisabledCore = <String>{
    PdvModuleIds.credit,
    PdvModuleIds.refund,
  };

  /// Opcionais forçados `disabled` até existirem no ERP (espelho de
  /// `POS_TEMPORARILY_DISABLED_MODULE_IDS` no erp-api).
  static const Set<String> temporarilyDisabledOptional = <String>{
    PdvModuleIds.tables,
    PdvModuleIds.tabs,
  };

  static bool allowsDisabledCore(String moduleId) =>
      serverForcedDisabledCore.contains(moduleId);

  /// Retorna um snapshot seguro: ids do catálogo preenchidos; núcleo forçado
  /// a `available` (salvo [serverForcedDisabledCore]); ids desconhecidos
  /// descartados; [temporarilyDisabledOptional] sempre `disabled`.
  static ModuleSetSnapshot ensureValid(ModuleSetSnapshot input) {
    final Map<String, PdvModuleState> next = <String, PdvModuleState>{};

    for (final PdvModuleDefinition def in pdvModuleCatalog) {
      final PdvModuleState? raw = input.states[def.id];
      if (def.isCore) {
        if (allowsDisabledCore(def.id) &&
            (raw == PdvModuleState.disabled ||
                raw == PdvModuleState.blocked)) {
          next[def.id] = raw!;
        } else {
          next[def.id] = PdvModuleState.available;
        }
      } else if (temporarilyDisabledOptional.contains(def.id)) {
        next[def.id] = PdvModuleState.disabled;
      } else {
        next[def.id] = raw ?? PdvModuleState.available;
      }
    }

    // Espelho do erp-api: um produto Delivery — quadro manda, `delivery` segue.
    final PdvModuleState orders =
        next[PdvModuleIds.deliveryOrders] ?? PdvModuleState.available;
    next[PdvModuleIds.delivery] = orders;

    return ModuleSetSnapshot(
      states: Map<String, PdvModuleState>.unmodifiable(next),
      profileName: input.profileName,
      updatedAt: input.updatedAt,
    );
  }

  /// `true` se algum módulo núcleo no input não está `available`
  /// (ignora [serverForcedDisabledCore]).
  static bool hasInvalidCore(ModuleSetSnapshot input) {
    for (final PdvModuleDefinition def in coreModuleDefinitions) {
      if (allowsDisabledCore(def.id)) {
        continue;
      }
      final PdvModuleState state =
          input.states[def.id] ?? PdvModuleState.available;
      if (state != PdvModuleState.available) {
        return true;
      }
    }
    return false;
  }
}
