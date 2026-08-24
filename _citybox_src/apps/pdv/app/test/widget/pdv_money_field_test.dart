import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/core/format/pdv_currency.dart';
import 'package:citybox_pdv/core/theme/pdv_theme.dart';
import 'package:citybox_pdv/ui/pdv_money_field.dart';

Future<TextEditingController> _pumpField(WidgetTester tester) async {
  final TextEditingController controller = TextEditingController();
  addTearDown(controller.dispose);

  await tester.pumpWidget(
    MaterialApp(
      theme: PdvTheme.data(),
      home: Scaffold(
        body: PdvMoneyField(label: 'Valor', controller: controller),
      ),
    ),
  );
  return controller;
}

void main() {
  testWidgets('mascara enquanto digita, dos centavos para cima', (
    WidgetTester tester,
  ) async {
    final TextEditingController controller = await _pumpField(tester);
    final Finder field = find.byType(TextField);

    await tester.enterText(field, '1');
    expect(controller.text, formatCents(1));

    await tester.enterText(field, '1250');
    expect(controller.text, formatCents(1250));
    expect(PdvMoneyField.centsOf(controller), 1250);
  });

  testWidgets('descarta o que não for dígito', (WidgetTester tester) async {
    final TextEditingController controller = await _pumpField(tester);

    await tester.enterText(find.byType(TextField), 'abc50xyz');
    expect(controller.text, formatCents(50));
  });

  testWidgets('campo intocado fica vazio, não "R\$ 0,00"', (
    WidgetTester tester,
  ) async {
    final TextEditingController controller = await _pumpField(tester);
    expect(controller.text, isEmpty);
    expect(PdvMoneyField.centsOf(controller), 0);

    // Apagar tudo volta ao vazio — não deixa um zero fantasma no campo.
    await tester.enterText(find.byType(TextField), '10');
    await tester.enterText(find.byType(TextField), '');
    expect(controller.text, isEmpty);
  });

  testWidgets('cursor fica no fim depois da máscara reescrever o texto', (
    WidgetTester tester,
  ) async {
    // Sem isto o cursor salta para o meio a cada tecla, porque a máscara
    // reescreve o campo inteiro.
    final TextEditingController controller = await _pumpField(tester);
    await tester.enterText(find.byType(TextField), '12345');

    expect(controller.selection.baseOffset, controller.text.length);
    expect(controller.selection.isCollapsed, isTrue);
  });

  testWidgets('onChangedCents entrega centavos, não o texto', (
    WidgetTester tester,
  ) async {
    final TextEditingController controller = TextEditingController();
    addTearDown(controller.dispose);
    int? seen;

    await tester.pumpWidget(
      MaterialApp(
        theme: PdvTheme.data(),
        home: Scaffold(
          body: PdvMoneyField(
            label: 'Valor',
            controller: controller,
            onChangedCents: (int cents) => seen = cents,
          ),
        ),
      ),
    );

    await tester.enterText(find.byType(TextField), '999');
    expect(seen, 999);
  });
}
