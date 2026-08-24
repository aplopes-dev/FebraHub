import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/core/theme/pdv_theme.dart';
import 'package:citybox_pdv/features/customer/application/customer_catalog_controller.dart';
import 'package:citybox_pdv/features/customer/data/customer_catalog.dart';
import 'package:citybox_pdv/features/customer/data/fixture_customer_catalog_source.dart';
import 'package:citybox_pdv/features/customer/domain/customer.dart';
import 'package:citybox_pdv/features/customer/presentation/widgets/customer_picker_dialog.dart';
import 'package:citybox_pdv/features/shared/application/shell_providers.dart';

List<Override> get _overrides => <Override>[
  showCustomTitleBarProvider.overrideWithValue(false),
  customerCatalogSourceProvider.overrideWithValue(
    FixtureCustomerCatalogSource(),
  ),
];

Future<void> _pumpDialog(WidgetTester tester) {
  tester.view.physicalSize = const Size(1280, 800);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);

  return tester.pumpWidget(
    ProviderScope(
      overrides: _overrides,
      child: MaterialApp(
        theme: PdvTheme.data(),
        home: Builder(
          builder: (BuildContext context) {
            return Scaffold(
              body: Center(
                child: FilledButton(
                  onPressed: () {
                    showCustomerPickerDialog(context, selected: null);
                  },
                  child: const Text('Abrir'),
                ),
              ),
            );
          },
        ),
      ),
    ),
  );
}

void main() {
  testWidgets('abre com título, busca e lista fixture', (
    WidgetTester tester,
  ) async {
    await _pumpDialog(tester);
    await tester.tap(find.text('Abrir'));
    await tester.pumpAndSettle();

    expect(find.text('Clientes'), findsOneWidget);
    expect(find.byIcon(Icons.people_outline), findsWidgets);
    expect(find.text(seedCustomers.first.name), findsOneWidget);
    expect(find.text('CANCELAR (ESC)'), findsOneWidget);
    expect(find.text('NOVO CLIENTE (INSERT)'), findsOneWidget);
  });

  testWidgets('não fecha ao tocar fora do diálogo', (
    WidgetTester tester,
  ) async {
    await _pumpDialog(tester);
    await tester.tap(find.text('Abrir'));
    await tester.pumpAndSettle();

    await tester.tapAt(const Offset(8, 8));
    await tester.pumpAndSettle();

    expect(find.text('Clientes'), findsOneWidget);
  });

  testWidgets('CANCELAR fecha o diálogo', (WidgetTester tester) async {
    await _pumpDialog(tester);
    await tester.tap(find.text('Abrir'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('CANCELAR (ESC)'));
    await tester.pumpAndSettle();

    expect(find.text('Clientes'), findsNothing);
  });

  testWidgets('ESC fecha o diálogo', (WidgetTester tester) async {
    await _pumpDialog(tester);
    await tester.tap(find.text('Abrir'));
    await tester.pumpAndSettle();

    await tester.sendKeyEvent(LogicalKeyboardKey.escape);
    await tester.pumpAndSettle();

    expect(find.text('Clientes'), findsNothing);
  });

  testWidgets('botão consultar abre a tela somente leitura', (
    WidgetTester tester,
  ) async {
    await _pumpDialog(tester);
    await tester.tap(find.text('Abrir'));
    await tester.pumpAndSettle();

    await tester.tap(find.byTooltip('Consultar cliente').first);
    await tester.pumpAndSettle();

    expect(find.text('CONSULTAR CLIENTE'), findsOneWidget);
    expect(find.text('SALVAR'), findsNothing);
  });

  testWidgets('INSERT abre cadastro de novo cliente', (
    WidgetTester tester,
  ) async {
    await _pumpDialog(tester);
    await tester.tap(find.text('Abrir'));
    await tester.pumpAndSettle();

    await tester.sendKeyEvent(LogicalKeyboardKey.insert);
    await tester.pumpAndSettle();

    expect(find.text('CADASTRAR CLIENTE'), findsOneWidget);
  });

  testWidgets('tocar na linha seleciona e fecha', (WidgetTester tester) async {
    CustomerSelection? selection;

    tester.view.physicalSize = const Size(1280, 800);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(
      ProviderScope(
        overrides: _overrides,
        child: MaterialApp(
          theme: PdvTheme.data(),
          home: Builder(
            builder: (BuildContext context) {
              return Scaffold(
                body: Center(
                  child: FilledButton(
                    onPressed: () async {
                      selection = await showCustomerPickerDialog(
                        context,
                        selected: null,
                      );
                    },
                    child: const Text('Abrir'),
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );

    await tester.tap(find.text('Abrir'));
    await tester.pumpAndSettle();

    final Customer first = seedCustomers.first;
    await tester.tap(find.text(first.name));
    await tester.pumpAndSettle();

    expect(selection?.customer?.id, first.id);
    expect(find.text('Clientes'), findsNothing);
  });
}
