import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/features/fiscal/data/pos_fiscal_settings_api.dart';
import 'package:citybox_pdv/features/fiscal/data/shared_preferences_pos_fiscal_settings_store.dart';
import 'package:citybox_pdv/features/fiscal/domain/pos_fiscal_settings.dart';
import 'package:citybox_pdv/features/shared/application/connectivity_controller.dart';
import 'package:citybox_pdv/features/terminal/application/device_credential_controller.dart';
import 'package:citybox_pdv/features/terminal/domain/device_credential.dart';

final Provider<PosFiscalSettingsApi> posFiscalSettingsApiProvider =
    Provider<PosFiscalSettingsApi>(
      (Ref ref) => PosFiscalSettingsApi(ref.watch(pdvApiClientProvider)),
    );

final Provider<PosFiscalSettingsStore?> posFiscalSettingsStoreProvider =
    Provider<PosFiscalSettingsStore?>((Ref ref) => null);

/// Política fiscal do PDV (modelo de NF). Nunca `null` — [PosFiscalSettings.unset]
/// até a primeira sync.
final NotifierProvider<PosFiscalSettingsController, PosFiscalSettings>
posFiscalSettingsProvider =
    NotifierProvider<PosFiscalSettingsController, PosFiscalSettings>(
      PosFiscalSettingsController.new,
    );

class PosFiscalSettingsController extends Notifier<PosFiscalSettings> {
  PosFiscalSettingsStore? _store;

  @override
  PosFiscalSettings build() {
    ref.listen<DeviceCredential?>(deviceCredentialProvider, (
      DeviceCredential? previous,
      DeviceCredential? next,
    ) {
      if (next == null) {
        unawaited(clear());
        return;
      }
      if (previous?.terminalId != next.terminalId) unawaited(refresh());
    });
    return PosFiscalSettings.unset;
  }

  Future<PosFiscalSettingsStore> _ensureStore() async {
    PosFiscalSettingsStore? store = ref.read(posFiscalSettingsStoreProvider);
    if (store != null) {
      _store = store;
      return store;
    }
    if (_store != null) return _store!;
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    store = SharedPreferencesPosFiscalSettingsStore(prefs);
    _store = store;
    return store;
  }

  Future<void> hydrate() async {
    final PosFiscalSettingsStore store = await _ensureStore();
    final PosFiscalSettings? cached = await store.read();
    if (cached != null) state = cached;
    await refresh();
  }

  Future<bool> refresh() async {
    if (ref.read(deviceCredentialProvider) == null) return false;
    try {
      final PosFiscalSettings fresh =
          await ref.read(posFiscalSettingsApiProvider).current();
      state = fresh;
      final PosFiscalSettingsStore store = await _ensureStore();
      await store.write(fresh);
      ref.read(terminalOnlineProvider.notifier).report(online: true);
      return true;
    } on PdvApiException catch (error) {
      if (error.isOffline) {
        ref.read(terminalOnlineProvider.notifier).report(online: false);
      }
      return false;
    }
  }

  Future<void> clear() async {
    final PosFiscalSettingsStore store = await _ensureStore();
    await store.clear();
    state = PosFiscalSettings.unset;
  }
}
