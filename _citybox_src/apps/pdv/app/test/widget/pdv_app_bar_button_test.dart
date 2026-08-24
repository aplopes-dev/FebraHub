import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/ui/pdv_app_bar_button.dart';

void main() {
  testWidgets(
    'a área de toque cobre a altura inteira da app bar, não só o conteúdo',
    (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SizedBox(
              height: PdvSizes.appBarHeight,
              child: PdvAppBarButton(
                icon: Icons.storefront_outlined,
                label: 'Minha Loja',
                onPressed: () {},
              ),
            ),
          ),
        ),
      );

      final Size inkWellSize = tester.getSize(find.byType(InkWell));

      // Se o `Row` interno (ícone + texto, `mainAxisSize: min`) vazasse a
      // própria altura para o `InkWell`, essa altura ficaria bem menor que a
      // da barra — é exatamente o bug que motivou o `SizedBox` explícito.
      expect(inkWellSize.height, PdvSizes.appBarHeight);
    },
  );
}
