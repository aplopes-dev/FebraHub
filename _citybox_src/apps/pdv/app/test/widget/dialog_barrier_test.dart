import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/core/theme/pdv_theme.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';

/// O véu atrás dos diálogos sai do tema, não do default do Flutter.
///
/// Trava porque `showDialog` cai em `Colors.black54` quando o tema não diz
/// nada — e 54% de preto sobre um app já escuro apaga a tela inteira. É um
/// ajuste que ninguém percebe ter se perdido até olhar um diálogo.
void main() {
  testWidgets('barreira do diálogo usa PdvColors.barrier', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: PdvTheme.data(),
        home: Builder(
          builder: (BuildContext context) {
            return Scaffold(
              body: Center(
                child: ElevatedButton(
                  onPressed:
                      () => showDialog<void>(
                        context: context,
                        builder:
                            (BuildContext ctx) =>
                                const AlertDialog(content: Text('Clientes')),
                      ),
                  child: const Text('abrir'),
                ),
              ),
            );
          },
        ),
      ),
    );

    await tester.tap(find.text('abrir'));
    await tester.pumpAndSettle();

    final ModalBarrier barrier = tester
        .widgetList<ModalBarrier>(find.byType(ModalBarrier))
        .firstWhere((ModalBarrier b) => b.color != null);

    expect(barrier.color, PdvColors.barrier);
    expect(
      barrier.color,
      isNot(Colors.black54),
      reason: 'caiu no default do Flutter',
    );
  });

  test('a barreira é bem mais clara que o default do Flutter', () {
    expect(PdvColors.barrier.a, lessThan(Colors.black54.a));
  });
}
