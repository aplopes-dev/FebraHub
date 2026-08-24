import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/features/home/presentation/home_page.dart';
import 'package:citybox_pdv/features/modules/application/module_visibility_controller.dart';
import 'package:citybox_pdv/features/modules/domain/module_ids.dart';

import '../helpers/fixed_module_visibility.dart';
import '../helpers/pump_with_router.dart';

void main() {
  testWidgets('módulo vendedor desligado esconde VENDEDOR na home', (
    WidgetTester tester,
  ) async {
    await pumpWithRouter(
      tester,
      initialLocation: PdvRoutes.home,
      withOpenShift: true,
      overrides: <Override>[
        moduleVisibilityProvider.overrideWith(
          () => FixedModuleVisibilityController(
            disabled: <String>{PdvModuleIds.seller},
            enforceCoreValidation: false,
          ),
        ),
      ],
    );

    expect(find.byType(HomePage), findsOneWidget);
    expect(find.text('VENDEDOR'), findsNothing);
    expect(find.text('BALCÃO'), findsOneWidget);
  });
}
