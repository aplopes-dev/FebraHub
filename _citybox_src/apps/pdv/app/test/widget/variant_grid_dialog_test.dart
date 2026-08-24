import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/core/theme/pdv_theme.dart';
import 'package:citybox_pdv/features/counter/domain/counter_product.dart';
import 'package:citybox_pdv/features/counter/domain/product_variant.dart';
import 'package:citybox_pdv/features/counter/presentation/widgets/variant_grid_dialog.dart';

final CounterProduct _shirt = CounterProduct(
  id: 'camisa_basica',
  name: 'Camisa básica',
  priceCents: 7990,
  categoryId: 'varejo',
  variants: <ProductVariant>[
    const ProductVariant(
      id: 'camisa_m_azul',
      productId: 'camisa_basica',
      attributes: <String, String>{'size': 'M', 'color': 'Azul'},
      priceCents: 7990,
    ),
    const ProductVariant(
      id: 'camisa_m_preta',
      productId: 'camisa_basica',
      attributes: <String, String>{'size': 'M', 'color': 'Preta'},
      priceCents: 8490,
      available: false,
    ),
  ],
);

void main() {
  testWidgets('Confirmar desabilitado até selecionar variante', (
    WidgetTester tester,
  ) async {
    tester.view.physicalSize = const Size(900, 800);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(
      MaterialApp(
        theme: PdvTheme.data(),
        home: Builder(
          builder: (BuildContext context) {
            return Scaffold(
              body: FilledButton(
                onPressed:
                    () => showVariantGridDialog(context, product: _shirt),
                child: const Text('abrir'),
              ),
            );
          },
        ),
      ),
    );

    await tester.tap(find.text('abrir'));
    await tester.pumpAndSettle();

    final FilledButton confirm = tester.widget(
      find.widgetWithText(FilledButton, 'Confirmar'),
    );
    expect(confirm.onPressed, isNull);

    await tester.tap(find.text('M / Azul'));
    await tester.pumpAndSettle();

    final FilledButton confirm2 = tester.widget(
      find.widgetWithText(FilledButton, 'Confirmar'),
    );
    expect(confirm2.onPressed, isNotNull);

    await tester.tap(find.text('Confirmar'));
    await tester.pumpAndSettle();
    expect(find.text('Camisa básica'), findsNothing);
  });
}
