import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:shared_preferences/shared_preferences.dart';

import 'package:citybox_pdv/features/modules/data/http_module_config_source.dart';
import 'package:citybox_pdv/features/modules/data/pos_module_api.dart';
import 'package:citybox_pdv/features/modules/data/segment_profiles.dart';
import 'package:citybox_pdv/features/modules/data/shared_preferences_module_cache.dart';
import 'package:citybox_pdv/features/terminal/application/device_credential_controller.dart';
import 'package:citybox_pdv/features/terminal/domain/device_credential.dart';
import 'package:citybox_pdv/features/modules/domain/module_config_source.dart';
import 'package:citybox_pdv/features/modules/domain/module_set_snapshot.dart';
import 'package:citybox_pdv/features/modules/domain/module_set_validator.dart';
import 'package:citybox_pdv/features/modules/domain/pdv_module_definition.dart';
import 'package:citybox_pdv/features/modules/domain/pdv_module_enums.dart';

/// API de módulos do terminal.
final Provider<PosModuleApi> posModuleApiProvider = Provider<PosModuleApi>(
  (Ref ref) => PosModuleApi(ref.watch(pdvApiClientProvider)),
);

/// Fonte injetável; override em testes com fake/cache mock.
///
/// `null` faz `hydrate` montar a fonte HTTP real — ver lá.
final Provider<ModuleConfigSource?> moduleConfigSourceProvider =
    Provider<ModuleConfigSource?>((Ref ref) => null);

/// Fonte única de "o que está ligado" no terminal.
final NotifierProvider<ModuleVisibilityController, ModuleSetSnapshot>
moduleVisibilityProvider =
    NotifierProvider<ModuleVisibilityController, ModuleSetSnapshot>(
      ModuleVisibilityController.new,
    );

class ModuleVisibilityController extends Notifier<ModuleSetSnapshot> {
  ModuleConfigSource? _source;

  @override
  ModuleSetSnapshot build() {
    // Repareamento pode ser noutra loja — o conjunto de módulos muda junto.
    ref.listen<DeviceCredential?>(deviceCredentialProvider, (
      DeviceCredential? previous,
      DeviceCredential? next,
    ) {
      if (next != null) unawaited(refresh());
    });

    return ModuleSetValidator.ensureValid(
      ModuleSetSnapshot.allAvailable(
        updatedAt: DateTime.fromMillisecondsSinceEpoch(0),
      ),
    );
  }

  bool isOperationallyVisible(String moduleId) =>
      state.isOperationallyVisible(moduleId);

  bool isVisible(String moduleId) => isOperationallyVisible(moduleId);

  void setModuleState(String moduleId, PdvModuleState newState) {
    final PdvModuleDefinition? def = findModuleDefinition(moduleId);
    if (def == null) {
      return;
    }
    if (def.isCore && newState != PdvModuleState.available) {
      return;
    }

    final Map<String, PdvModuleState> next = Map<String, PdvModuleState>.of(
      state.states,
    );
    next[moduleId] = newState;
    replaceSnapshot(
      state.copyWith(
        states: next,
        clearProfileName: true,
        updatedAt: DateTime.now(),
      ),
    );
  }

  void setVisible(String moduleId, {required bool visible}) {
    setModuleState(
      moduleId,
      visible ? PdvModuleState.available : PdvModuleState.disabled,
    );
  }

  void applyProfile(String profileName) {
    replaceSnapshot(buildSegmentProfile(profileName));
  }

  void replaceSnapshot(ModuleSetSnapshot snapshot) {
    state = ModuleSetValidator.ensureValid(snapshot);
    unawaited(_persist(state));
  }

  /// Carrega os módulos uma vez no start do app.
  ///
  /// A fonte é o **ERP** desde a fatia de módulos por terminal; o cache local
  /// só cobre falta de rede. Ver `HttpModuleConfigSource`.
  Future<void> hydrate() async {
    final ModuleConfigSource source =
        ref.read(moduleConfigSourceProvider) ??
        HttpModuleConfigSource(
          api: ref.read(posModuleApiProvider),
          cache: SharedPreferencesModuleCache(
            await SharedPreferences.getInstance(),
          ),
          isPaired: () => ref.read(deviceCredentialProvider) != null,
        );
    _source = source;
    state = ModuleSetValidator.ensureValid(await source.load());
  }

  /// Rebusca no servidor — usado quando o terminal é pareado (a loja pode ser
  /// outra) e quando a rede volta.
  Future<void> refresh() async {
    final ModuleConfigSource? source =
        ref.read(moduleConfigSourceProvider) ?? _source;
    if (source == null) return;
    state = ModuleSetValidator.ensureValid(await source.load());
  }

  Future<void> _persist(ModuleSetSnapshot snapshot) async {
    final ModuleConfigSource? source =
        ref.read(moduleConfigSourceProvider) ?? _source;
    if (source == null) {
      return;
    }
    await source.save(snapshot);
  }
}
