import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/features/counter/application/counter_cart_controller.dart';
import 'package:citybox_pdv/features/counter/presentation/widgets/counter_toolbar.dart';
import 'package:citybox_pdv/features/modules/application/module_visibility_controller.dart';
import 'package:citybox_pdv/features/modules/domain/module_ids.dart';

import '../helpers/catalog_fixture.dart';
import '../helpers/fixed_module_visibility.dart';

Finder _barcodeField() {
  return find.byWidgetPredicate(
    (Widget w) =>
        w is TextField &&
        (w.decoration?.hintText?.contains('código') == true ||
            w.decoration?.hintText?.contains('Cód') == true ||
            w.decoration?.hintText?.contains('barras') == true),
  );
}

Future<ProviderContainer> _pumpToolbar(
  WidgetTester tester, {
  List<Override> overrides = const <Override>[],
}) async {
  tester.view.physicalSize = const Size(1400, 800);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);

  late ProviderContainer container;
  await tester.pumpWidget(
    ProviderScope(
      overrides: <Override>[...fixtureCatalogOverrides(), ...overrides],
      child: MaterialApp(
        home: Scaffold(
          body: Consumer(
            builder: (BuildContext context, WidgetRef ref, _) {
              container = ProviderScope.containerOf(context);
              return const CounterToolbar();
            },
          ),
        ),
      ),
    ),
  );
  await tester.pumpAndSettle();
  return container;
}

void main() {
  testWidgets('código válido adiciona linha ao carrinho', (
    WidgetTester tester,
  ) async {
    final ProviderContainer container = await _pumpToolbar(
      tester,
      overrides: <Override>[
        moduleVisibilityProvider.overrideWith(
          () => FixedModuleVisibilityController(),
        ),
      ],
    );

    await tester.enterText(_barcodeField(), '7894900011517');
    await tester.testTextInput.receiveAction(TextInputAction.done);
    await tester.pumpAndSettle();

    expect(container.read(counterCartProvider), isNotEmpty);
    expect(
      container.read(counterCartProvider).single.product.barcodes,
      contains('7894900011517'),
    );
  });

  testWidgets('código inválido mostra erro e não altera carrinho', (
    WidgetTester tester,
  ) async {
    final ProviderContainer container = await _pumpToolbar(
      tester,
      overrides: <Override>[
        moduleVisibilityProvider.overrideWith(
          () => FixedModuleVisibilityController(),
        ),
      ],
    );

    await tester.enterText(_barcodeField(), '0000000000000');
    await tester.testTextInput.receiveAction(TextInputAction.done);
    await tester.pumpAndSettle();

    expect(container.read(counterCartProvider), isEmpty);
    expect(container.read(counterBarcodeErrorProvider), isNotNull);
  });

  testWidgets('módulo barcode off esconde o campo', (
    WidgetTester tester,
  ) async {
    await _pumpToolbar(
      tester,
      overrides: <Override>[
        moduleVisibilityProvider.overrideWith(
          () => FixedModuleVisibilityController(
            disabled: <String>{PdvModuleIds.barcode},
            enforceCoreValidation: false,
          ),
        ),
      ],
    );

    expect(_barcodeField(), findsNothing);
  });
}
