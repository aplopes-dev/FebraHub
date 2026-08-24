import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/features/cash/presentation/cash_hub_page.dart';
import 'package:citybox_pdv/features/modules/application/module_visibility_controller.dart';
import 'package:citybox_pdv/features/refund/presentation/refund_page.dart';
import 'package:citybox_pdv/ui/pdv_filled_field.dart';

import '../helpers/fixed_module_visibility.dart';
import '../helpers/pump_with_router.dart';

void main() {
  testWidgets('Home Devolução → /refund com turno', (
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

    await tester.tap(find.text('DEVOLUÇÃO'));
    await tester.pumpAndSettle();

    expect(find.byType(RefundPage), findsOneWidget);
    expect(find.byType(PdvFilledField), findsWidgets);
  });

  testWidgets('sem turno, /refund redireciona ao caixa', (
    WidgetTester tester,
  ) async {
    await pumpWithRouter(
      tester,
      initialLocation: PdvRoutes.refund,
      withOpenShift: false,
    );

    expect(find.byType(RefundPage), findsNothing);
    expect(find.byType(CashHubPage), findsOneWidget);
  });
}
