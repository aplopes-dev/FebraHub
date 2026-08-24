import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/ui/pdv_app_bar_filled_button.dart';

void main() {
  testWidgets('a área de toque cobre a altura inteira da app bar', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SizedBox(
            height: PdvSizes.appBarHeight,
            child: PdvAppBarFilledButton(
              label: 'Salvar e selecionar',
              backgroundColor: PdvColors.success,
              onPressed: () {},
            ),
          ),
        ),
      ),
    );

    final Size inkWellSize = tester.getSize(find.byType(InkWell));
    expect(inkWellSize.height, PdvSizes.appBarHeight);
  });
}
