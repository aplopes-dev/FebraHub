import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/features/home/presentation/home_page.dart';
import 'package:citybox_pdv/features/settings/presentation/settings_page.dart';

import '../helpers/pump_with_router.dart';

void main() {
  testWidgets('CONFIGURAÇÕES na home abre a tela de configurações', (
    WidgetTester tester,
  ) async {
    await pumpWithRouter(
      tester,
      initialLocation: PdvRoutes.home,
      withOpenShift: true,
    );

    expect(find.byType(HomePage), findsOneWidget);
    await tester.tap(find.text('CONFIGURAÇÕES'));
    await tester.pumpAndSettle();

    expect(find.byType(SettingsPage), findsOneWidget);
    expect(find.text('Terminal'), findsOneWidget);
    expect(find.text('Módulos'), findsOneWidget);
  });
}
