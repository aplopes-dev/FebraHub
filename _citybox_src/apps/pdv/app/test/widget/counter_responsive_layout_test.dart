import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/core/theme/pdv_theme.dart';
import 'package:citybox_pdv/features/counter/presentation/counter_page.dart';
import 'package:citybox_pdv/features/counter/presentation/widgets/counter_totals_panel.dart';
import 'package:citybox_pdv/features/shared/application/shell_providers.dart';

import '../helpers/catalog_fixture.dart';

void main() {
  testWidgets('CounterPage em largura 800 não overflowa o botão PAGAMENTO', (
    WidgetTester tester,
  ) async {
    tester.view.physicalSize = const Size(800, 1200);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(
      ProviderScope(
        overrides: <Override>[
          showCustomTitleBarProvider.overrideWithValue(false),
          ...fixtureCatalogOverrides(),
        ],
        child: MaterialApp(theme: PdvTheme.data(), home: const CounterPage()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('PAGAMENTO'), findsOneWidget);
    expect(find.byType(CounterTotalsPanel), findsOneWidget);
  });
}
