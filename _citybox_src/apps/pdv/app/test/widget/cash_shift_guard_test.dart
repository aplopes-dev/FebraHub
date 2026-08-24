import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/features/cash/presentation/cash_hub_page.dart';
import 'package:citybox_pdv/features/counter/presentation/counter_page.dart';

import '../helpers/pump_with_router.dart';

void main() {
  testWidgets('sem turno aberto, /counter redireciona para o hub de caixa', (
    WidgetTester tester,
  ) async {
    await pumpWithRouter(
      tester,
      initialLocation: PdvRoutes.counter,
      withOpenShift: false,
    );

    expect(find.byType(CounterPage), findsNothing);
    expect(find.byType(CashHubPage), findsOneWidget);
    expect(find.text('Nenhum turno aberto'), findsOneWidget);
    expect(find.text('Abrir caixa'), findsWidgets);
  });

  testWidgets('com turno aberto, /counter mostra o Balcão', (
    WidgetTester tester,
  ) async {
    await pumpWithRouter(
      tester,
      initialLocation: PdvRoutes.counter,
      withOpenShift: true,
    );

    expect(find.byType(CounterPage), findsOneWidget);
    expect(find.byType(CashHubPage), findsNothing);
    expect(find.text('VOLTAR'), findsOneWidget);
  });
}
