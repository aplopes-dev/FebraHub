import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/features/counter/presentation/counter_page.dart';
import 'package:citybox_pdv/features/customer/presentation/customer_form_page.dart';
import 'package:citybox_pdv/features/home/presentation/home_page.dart';
import 'package:citybox_pdv/features/payment/presentation/payment_page.dart';
import 'package:citybox_pdv/features/payment/presentation/sale_completed_page.dart';

import '../helpers/pump_with_router.dart';

void main() {
  testWidgets('rotas nomeadas resolvem as cinco páginas', (
    WidgetTester tester,
  ) async {
    await pumpWithRouter(tester, initialLocation: PdvRoutes.home);
    expect(find.byType(HomePage), findsOneWidget);

    await pumpWithRouter(tester, initialLocation: PdvRoutes.counter);
    expect(find.byType(CounterPage), findsOneWidget);

    await pumpWithRouter(tester, initialLocation: PdvRoutes.payment);
    expect(find.byType(PaymentPage), findsOneWidget);

    await pumpWithRouter(tester, initialLocation: PdvRoutes.saleCompleted);
    expect(find.byType(SaleCompletedPage), findsOneWidget);

    await pumpWithRouter(tester, initialLocation: PdvRoutes.customerForm);
    expect(find.byType(CustomerFormPage), findsOneWidget);
  });
}
