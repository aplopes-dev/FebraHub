import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/features/credit/presentation/credit_page.dart';
import 'package:citybox_pdv/features/modules/application/module_visibility_controller.dart';
import 'package:citybox_pdv/ui/pdv_filled_field.dart';

import '../helpers/fixed_module_visibility.dart';
import '../helpers/pump_with_router.dart';

void main() {
  testWidgets('Home Crédito → /credit; empty extrato até selecionar', (
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

    await tester.tap(find.text('CRÉDITO DOS CLIENTES'));
    await tester.pumpAndSettle();

    expect(find.byType(CreditPage), findsOneWidget);
    expect(find.byType(PdvFilledField), findsWidgets);
    expect(find.text('Selecione um cliente'), findsOneWidget);
  });

  testWidgets('rota direta /credit com turno', (WidgetTester tester) async {
    await pumpWithRouter(
      tester,
      initialLocation: PdvRoutes.credit,
      withOpenShift: true,
    );

    expect(find.byType(CreditPage), findsOneWidget);
  });
}
