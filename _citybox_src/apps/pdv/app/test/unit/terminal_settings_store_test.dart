import 'package:citybox_pdv/features/settings/data/shared_preferences_terminal_settings_store.dart';
import 'package:citybox_pdv/features/settings/domain/terminal_settings.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  test('load/save terminal settings', () async {
    SharedPreferences.setMockInitialValues(<String, Object>{});
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    final SharedPreferencesTerminalSettingsStore store =
        SharedPreferencesTerminalSettingsStore(prefs);

    await store.write(
      const TerminalSettings(
        terminalLabel: 'Caixa 2',
        printerName: 'Epson',
        cashDrawerEnabled: false,
        scaleEnabled: true,
      ),
    );
    final TerminalSettings loaded = await store.read();
    expect(loaded.terminalLabel, 'Caixa 2');
    expect(loaded.printerName, 'Epson');
    expect(loaded.cashDrawerEnabled, isFalse);
    expect(loaded.scaleEnabled, isTrue);
  });
}
