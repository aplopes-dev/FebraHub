import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/core/theme/pdv_theme.dart';
import 'package:citybox_pdv/features/counter/domain/counter_product.dart';
import 'package:citybox_pdv/features/counter/presentation/widgets/scale_weight_dialog.dart';

const CounterProduct _banana = CounterProduct(
  id: 'banana_kg',
  name: 'Banana prata (kg)',
  priceCents: 0,
  categoryId: 'hortifruti',
  soldByWeight: true,
  pricePerKgCents: 699,
);

void main() {
  testWidgets('peso ≤0 impede confirmação; peso válido retorna lineCents', (
    WidgetTester tester,
  ) async {
    tester.view.physicalSize = const Size(900, 800);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);

    ScaleWeightResult? result;
    await tester.pumpWidget(
      MaterialApp(
        theme: PdvTheme.data(),
        home: Builder(
          builder: (BuildContext context) {
            return Scaffold(
              body: FilledButton(
                onPressed: () async {
                  result = await showScaleWeightDialog(
                    context,
                    product: _banana,
                  );
                },
                child: const Text('abrir'),
              ),
            );
          },
        ),
      ),
    );

    await tester.tap(find.text('abrir'));
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), '0');
    await tester.tap(find.text('Confirmar'));
    await tester.pumpAndSettle();
    expect(find.textContaining('maior que zero'), findsOneWidget);
    expect(result, isNull);

    await tester.enterText(find.byType(TextField), '0.5');
    await tester.tap(find.text('Confirmar'));
    await tester.pumpAndSettle();

    expect(result, isNotNull);
    expect(result!.weightKg, 0.5);
    expect(result!.lineCents, 350);
  });
}
