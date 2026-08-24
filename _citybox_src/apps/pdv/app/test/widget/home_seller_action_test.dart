import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/features/home/presentation/home_page.dart';

import '../helpers/operator_fixture.dart';
import '../helpers/pump_with_router.dart';

void main() {
  testWidgets('VENDEDOR na home mostra o operador logado como padrão', (
    WidgetTester tester,
  ) async {
    await pumpWithRouter(
      tester,
      initialLocation: PdvRoutes.home,
      withOpenShift: true,
    );
    await tester.pumpAndSettle();

    expect(find.byType(HomePage), findsOneWidget);
    expect(find.text('VENDEDOR'), findsOneWidget);
    expect(find.text(testOperator.name.toUpperCase()), findsOneWidget);
  });

  testWidgets('VENDEDOR na home abre o seletor de vendedor', (
    WidgetTester tester,
  ) async {
    await pumpWithRouter(
      tester,
      initialLocation: PdvRoutes.home,
      withOpenShift: true,
    );
    await tester.pumpAndSettle();

    expect(find.byType(HomePage), findsOneWidget);
    await tester.tap(find.text('VENDEDOR'));
    await tester.pumpAndSettle();

    expect(find.text('Vendedores'), findsOneWidget);
    expect(find.text('Buscar por nome ou código'), findsOneWidget);
    expect(find.text('CANCELAR (ESC)'), findsOneWidget);
    expect(find.text('Sem vendedor'), findsOneWidget);
  });
}
