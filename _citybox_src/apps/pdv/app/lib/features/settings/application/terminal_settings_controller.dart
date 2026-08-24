import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:citybox_pdv/features/settings/data/shared_preferences_terminal_settings_store.dart';
import 'package:citybox_pdv/features/settings/domain/terminal_settings.dart';

final Provider<SharedPreferencesTerminalSettingsStore?>
terminalSettingsStoreProvider =
    Provider<SharedPreferencesTerminalSettingsStore?>((Ref ref) => null);

final NotifierProvider<TerminalSettingsController, TerminalSettings>
terminalSettingsProvider =
    NotifierProvider<TerminalSettingsController, TerminalSettings>(
      TerminalSettingsController.new,
    );

class TerminalSettingsController extends Notifier<TerminalSettings> {
  SharedPreferencesTerminalSettingsStore? _store;

  @override
  TerminalSettings build() => const TerminalSettings();

  Future<void> hydrate() async {
    SharedPreferencesTerminalSettingsStore? store = ref.read(
      terminalSettingsStoreProvider,
    );
    if (store == null) {
      final SharedPreferences prefs = await SharedPreferences.getInstance();
      store = SharedPreferencesTerminalSettingsStore(prefs);
    }
    _store = store;
    state = await store.read();
  }

  Future<void> update(TerminalSettings next) async {
    state = next;
    await _store?.write(next);
  }
}
