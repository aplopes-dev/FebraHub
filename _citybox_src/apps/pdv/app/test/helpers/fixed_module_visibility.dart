import 'package:citybox_pdv/features/modules/application/module_visibility_controller.dart';
import 'package:citybox_pdv/features/modules/domain/module_set_snapshot.dart';
import 'package:citybox_pdv/features/modules/domain/module_set_validator.dart';
import 'package:citybox_pdv/features/modules/domain/pdv_module_definition.dart';
import 'package:citybox_pdv/features/modules/domain/pdv_module_enums.dart';

/// Controller de teste com ids desabilitados (ou bloqueados) desde o start.
///
/// [enforceCoreValidation] default `true` (produção). Em `false`, permite
/// desligar ids núcleo só para provar o gate de UI (§5.8 / T038).
class FixedModuleVisibilityController extends ModuleVisibilityController {
  FixedModuleVisibilityController({
    Set<String> disabled = const <String>{},
    Set<String> blocked = const <String>{},
    this.profileName,
    this.enforceCoreValidation = true,
  }) : _disabled = disabled,
       _blocked = blocked;

  final Set<String> _disabled;
  final Set<String> _blocked;
  final String? profileName;
  final bool enforceCoreValidation;

  @override
  ModuleSetSnapshot build() {
    final Map<String, PdvModuleState> states = <String, PdvModuleState>{
      for (final PdvModuleDefinition def in pdvModuleCatalog)
        def.id: PdvModuleState.available,
    };
    for (final String id in _disabled) {
      states[id] = PdvModuleState.disabled;
    }
    for (final String id in _blocked) {
      states[id] = PdvModuleState.blocked;
    }
    final ModuleSetSnapshot raw = ModuleSetSnapshot(
      states: states,
      profileName: profileName,
      updatedAt: DateTime.fromMillisecondsSinceEpoch(0),
    );
    if (!enforceCoreValidation) {
      return raw;
    }
    return ModuleSetValidator.ensureValid(raw);
  }

  @override
  Future<void> hydrate() async {
    // Mantém o snapshot fixo do construtor — hydrate do PdvApp não sobrescreve.
  }
}
