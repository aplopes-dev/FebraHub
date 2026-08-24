import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/features/counter/application/counter_cart_controller.dart';
import 'package:citybox_pdv/features/counter/domain/counter_product.dart';
import 'package:citybox_pdv/features/payment/application/payment_entries_controller.dart';
import 'package:citybox_pdv/features/payment/domain/payment_entry.dart';
import 'package:citybox_pdv/features/payment/domain/payment_method.dart';
import 'package:citybox_pdv/features/payment/presentation/payment_page.dart';
import 'package:citybox_pdv/features/payment/presentation/sale_completed_page.dart';

import '../helpers/pump_with_router.dart';

const CounterProduct _cola = CounterProduct(
  id: 'coca_1l',
  name: 'Coca Cola 1 Litro',
  priceCents: 1000,
  categoryId: 'bebidas',
);

const PaymentMethod _cash = PaymentMethod(id: 'cash', label: 'Dinheiro');

void main() {
  testWidgets(
    'após sale-completed, voltar não restaura pagamento da venda anterior',
    (WidgetTester tester) async {
      final ProviderContainer container = await pumpWithRouter(
        tester,
        initialLocation: PdvRoutes.saleCompleted,
      );

      // A página limpa no post-frame.
      expect(container.read(counterCartProvider), isEmpty);
      expect(container.read(paymentEntriesProvider), isEmpty);

      // Simula tentativa de "voltar" para pagamento via go (replace stack).
      // context.go limpa a pilha — PaymentPage não herda a venda anterior.
      await pumpWithRouter(tester, initialLocation: PdvRoutes.payment);
      expect(find.byType(PaymentPage), findsOneWidget);
      expect(find.byType(SaleCompletedPage), findsNothing);

      final ProviderContainer paymentContainer = ProviderScope.containerOf(
        tester.element(find.byType(PaymentPage)),
      );
      expect(paymentContainer.read(paymentEntriesProvider), isEmpty);

      // Semear pagamentos e ir a sale-completed de novo limpa.
      paymentContainer.read(counterCartProvider.notifier).addProduct(_cola);
      paymentContainer
          .read(paymentEntriesProvider.notifier)
          .add(const PaymentEntry(method: _cash, amountCents: 1000));

      await pumpWithRouter(tester, initialLocation: PdvRoutes.saleCompleted);
      final ProviderContainer done = ProviderScope.containerOf(
        tester.element(find.byType(SaleCompletedPage)),
      );
      expect(done.read(counterCartProvider), isEmpty);
      expect(done.read(paymentEntriesProvider), isEmpty);
    },
  );
}
