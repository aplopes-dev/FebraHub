import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/features/settings/domain/settings_section.dart';
import 'package:citybox_pdv/features/settings/presentation/settings_page.dart';

import '../helpers/pump_with_router.dart';

Future<void> _openSection(WidgetTester tester, SettingsSection section) async {
  // O rótulo aparece na navegação e na barra; a navegação é a primeira.
  await tester.tap(find.text(section.label).first);
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('abre na sessão e lista todas as seções na navegação', (
    WidgetTester tester,
  ) async {
    await pumpWithRouter(
      tester,
      initialLocation: PdvRoutes.settings,
      withOpenShift: true,
    );

    expect(find.byType(SettingsPage), findsOneWidget);
    for (final SettingsSection section in SettingsSection.values) {
      expect(
        find.text(section.label),
        findsWidgets,
        reason: 'seção ${section.name} sumiu da navegação',
      );
    }
    // Seção inicial: o que só se lê.
    expect(find.text('Nome do caixa'), findsOneWidget);
  });

  testWidgets('módulos são somente leitura com cadeado, sem switch por tela', (
    WidgetTester tester,
  ) async {
    await pumpWithRouter(
      tester,
      initialLocation: PdvRoutes.settings,
      withOpenShift: true,
    );
    await _openSection(tester, SettingsSection.modules);

    expect(find.textContaining('Configurado no ERP'), findsOneWidget);
    expect(find.byIcon(Icons.lock_outline), findsWidgets);
    expect(find.widgetWithText(SwitchListTile, 'Balcão'), findsNothing);
    expect(find.widgetWithText(SwitchListTile, 'Mesas'), findsNothing);

    await tester.tap(find.text('Balcão').first);
    await tester.pump();
    expect(find.byType(SwitchListTile), findsNothing);
  });

  testWidgets('terminal mantém os dois switches de hardware', (
    WidgetTester tester,
  ) async {
    await pumpWithRouter(
      tester,
      initialLocation: PdvRoutes.settings,
      withOpenShift: true,
    );
    await _openSection(tester, SettingsSection.terminal);

    expect(find.byType(SwitchListTile), findsNWidgets(2));
    expect(find.text('Gaveta habilitada'), findsOneWidget);
    expect(find.text('Balança habilitada'), findsOneWidget);
  });

  testWidgets('touch screen tem a preferência da barra de rolagem', (
    WidgetTester tester,
  ) async {
    await pumpWithRouter(
      tester,
      initialLocation: PdvRoutes.settings,
      withOpenShift: true,
    );
    await _openSection(tester, SettingsSection.touch);

    expect(find.text('Aumentar o tamanho da barra de rolagem'), findsOneWidget);
    expect(find.byType(Checkbox), findsOneWidget);
  });

  testWidgets('favoritos tem as duas colunas de três posições', (
    WidgetTester tester,
  ) async {
    await pumpWithRouter(
      tester,
      initialLocation: PdvRoutes.settings,
      withOpenShift: true,
    );
    await _openSection(tester, SettingsSection.favorites);

    expect(find.text('Primeira coluna'), findsOneWidget);
    expect(find.text('Segunda coluna'), findsOneWidget);
    expect(find.text('Primeira linha'), findsNWidgets(2));
    expect(find.text('Segunda linha'), findsNWidgets(2));
    expect(find.text('Terceira linha'), findsNWidgets(2));
    expect(find.text('RESTAURAR FAVORITOS PADRÃO'), findsOneWidget);
  });
}
