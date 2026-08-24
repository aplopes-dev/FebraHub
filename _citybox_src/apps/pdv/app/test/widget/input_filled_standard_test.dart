import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/core/theme/pdv_theme.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/ui/pdv_filled_field.dart';

/// O campo do PDV é **filled com underline**, nunca outlined.
///
/// Trava porque o contorno fechado já foi o padrão aqui: campo preenchido
/// *mais* moldura em volta, um retângulo dentro do outro. Se alguém trocar o
/// traço de volta para `OutlineInputBorder`, o app inteiro muda de cara — e é
/// o tipo de mudança que ninguém repara num diff de tema.
void main() {
  group('tema', () {
    final InputDecorationThemeData decoration =
        PdvTheme.data().inputDecorationTheme;

    test('preenche o campo com inputFill', () {
      expect(decoration.filled, isTrue);
      expect(decoration.fillColor, PdvColors.inputFill);
    });

    test('usa underline em todos os estados, não contorno fechado', () {
      final Map<String, InputBorder?> borders = <String, InputBorder?>{
        'border': decoration.border,
        'enabledBorder': decoration.enabledBorder,
        'focusedBorder': decoration.focusedBorder,
        'errorBorder': decoration.errorBorder,
        'focusedErrorBorder': decoration.focusedErrorBorder,
        'disabledBorder': decoration.disabledBorder,
      };

      borders.forEach((String name, InputBorder? border) {
        expect(
          border,
          isA<UnderlineInputBorder>(),
          reason: '$name voltou a ser contorno fechado',
        );
      });
    });
  });

  group('pdvFilledDecoration', () {
    final InputDecoration decoration = pdvFilledDecoration(label: 'Campo');

    test('preenche o campo', () {
      expect(decoration.filled, isTrue);
      expect(decoration.fillColor, PdvColors.inputFill);
    });

    test('usa underline em todos os estados', () {
      for (final InputBorder? border in <InputBorder?>[
        decoration.border,
        decoration.enabledBorder,
        decoration.focusedBorder,
        decoration.errorBorder,
        decoration.focusedErrorBorder,
        decoration.disabledBorder,
      ]) {
        expect(border, isA<UnderlineInputBorder>());
      }
    });
  });

  testWidgets('PdvFilledField renderiza preenchido com underline', (
    WidgetTester tester,
  ) async {
    final TextEditingController controller = TextEditingController();
    addTearDown(controller.dispose);

    await tester.pumpWidget(
      MaterialApp(
        theme: PdvTheme.data(),
        home: Scaffold(
          body: PdvFilledField(label: 'Nome', controller: controller),
        ),
      ),
    );

    final TextField field = tester.widget<TextField>(find.byType(TextField));
    expect(field.decoration?.filled, isTrue);
    expect(field.decoration?.border, isA<UnderlineInputBorder>());
  });
}
