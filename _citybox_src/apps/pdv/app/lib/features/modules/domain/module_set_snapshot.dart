import 'package:citybox_pdv/features/modules/domain/pdv_module_definition.dart';
import 'package:citybox_pdv/features/modules/domain/pdv_module_enums.dart';

/// Conjunto pronto de módulos do terminal (o que o ERP enviaria).
class ModuleSetSnapshot {
  const ModuleSetSnapshot({
    required this.states,
    this.profileName,
    required this.updatedAt,
  });

  /// Estado por id de módulo. Preferível map completo do catálogo.
  final Map<String, PdvModuleState> states;

  /// Nome do perfil fixture, se aplicável.
  final String? profileName;

  final DateTime updatedAt;

  /// Ausente no map → trata como [PdvModuleState.available] (default seguro
  /// só após validação; preferir map completo nos perfis).
  PdvModuleState stateFor(String moduleId) =>
      states[moduleId] ?? PdvModuleState.available;

  /// Única consulta que a UI operacional deve usar (FR-017).
  bool isOperationallyVisible(String moduleId) =>
      stateFor(moduleId) == PdvModuleState.available;

  ModuleSetSnapshot copyWith({
    Map<String, PdvModuleState>? states,
    String? profileName,
    bool clearProfileName = false,
    DateTime? updatedAt,
  }) {
    return ModuleSetSnapshot(
      states: states ?? this.states,
      profileName: clearProfileName ? null : (profileName ?? this.profileName),
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  /// Snapshot com todos os ids do catálogo em [PdvModuleState.available].
  factory ModuleSetSnapshot.allAvailable({
    String? profileName,
    DateTime? updatedAt,
  }) {
    return ModuleSetSnapshot(
      states: <String, PdvModuleState>{
        for (final PdvModuleDefinition def in pdvModuleCatalog)
          def.id: PdvModuleState.available,
      },
      profileName: profileName,
      updatedAt: updatedAt ?? DateTime.now(),
    );
  }
}
