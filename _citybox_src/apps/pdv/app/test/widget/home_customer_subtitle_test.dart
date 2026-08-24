import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/features/counter/application/counter_customer_controller.dart';
import 'package:citybox_pdv/features/customer/domain/customer.dart';
import 'package:citybox_pdv/features/home/presentation/home_page.dart';

import '../helpers/pump_with_router.dart';

void main() {
  const Customer selected = Customer(
    id: 'cust-1',
    name: 'Maria Silva',
    document: '12345678901',
  );

  testWidgets('CLIENTE na home mostra o padrão e depois o nome escolhido', (
    WidgetTester tester,
  ) async {
    final container = await pumpWithRouter(
      tester,
      initialLocation: PdvRoutes.home,
      withOpenShift: true,
    );
    await tester.pumpAndSettle();

    expect(find.byType(HomePage), findsOneWidget);
    expect(find.text('CLIENTE'), findsOneWidget);
    expect(
      find.text(
        CounterCustomerController.defaultCustomerLabel.toUpperCase(),
      ),
      findsOneWidget,
    );

    container.read(counterCustomerProvider.notifier).setCustomer(selected);
    await tester.pumpAndSettle();

    expect(find.text(selected.name.toUpperCase()), findsOneWidget);
    expect(
      find.text(
        CounterCustomerController.defaultCustomerLabel.toUpperCase(),
      ),
      findsNothing,
    );
  });
}
