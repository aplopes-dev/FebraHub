import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/features/cash/presentation/cash_hub_page.dart';
import 'package:citybox_pdv/features/modules/application/module_visibility_controller.dart';
import 'package:citybox_pdv/features/price_check/presentation/price_check_page.dart';

import '../helpers/fixed_module_visibility.dart';
import '../helpers/pump_with_router.dart';

void main() {
  testWidgets('Home Consulta de preço → /price-check com turno', (
    WidgetTester tester,
  ) async {
    await pumpWithRouter(
      tester,
      initialLocation: PdvRoutes.home,
      withOpenShift: true,
      overrides: <Override>[
        moduleVisibilityProvider.overrideWith(
          () => FixedModuleVisibilityController(),
        ),
      ],
    );

    await tester.tap(find.text('CONSULTA DE PREÇO'));
    await tester.pumpAndSettle();

    expect(find.byType(PriceCheckPage), findsOneWidget);
  });

  testWidgets('sem turno, /price-check redireciona ao caixa', (
    WidgetTester tester,
  ) async {
    await pumpWithRouter(
      tester,
      initialLocation: PdvRoutes.priceCheck,
      withOpenShift: false,
    );

    expect(find.byType(PriceCheckPage), findsNothing);
    expect(find.byType(CashHubPage), findsOneWidget);
  });
}
