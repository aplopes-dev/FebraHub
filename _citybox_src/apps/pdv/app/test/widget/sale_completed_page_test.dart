import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/core/theme/pdv_theme.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/counter/application/counter_cart_controller.dart';
import 'package:citybox_pdv/features/counter/domain/counter_product.dart';
import 'package:citybox_pdv/features/modules/application/module_visibility_controller.dart';
import 'package:citybox_pdv/features/modules/domain/module_ids.dart';
import 'package:citybox_pdv/features/payment/application/payment_entries_controller.dart';
import 'package:citybox_pdv/features/payment/application/sale_note_controller.dart';
import 'package:citybox_pdv/features/payment/application/sale_seller_controller.dart';
import 'package:citybox_pdv/features/payment/data/seller_catalog.dart';
import 'package:citybox_pdv/features/payment/domain/payment_entry.dart';
import 'package:citybox_pdv/features/payment/domain/payment_method.dart';
import 'package:citybox_pdv/features/payment/presentation/sale_completed_page.dart';
import 'package:citybox_pdv/features/shared/application/shell_providers.dart';

import '../helpers/fixed_module_visibility.dart';
import '../helpers/pump_with_router.dart';

const CounterProduct _cola = CounterProduct(
  id: 'coca_1l',
  name: 'Coca Cola 1 Litro',
  priceCents: 1000,
  categoryId: 'bebidas',
);

const PaymentMethod _cash = PaymentMethod(id: 'cash', label: 'Dinheiro');

Future<ProviderContainer> _pumpCompleted(
  WidgetTester tester, {
  List<Override> overrides = const <Override>[],
}) {
  return pumpWithRouter(
    tester,
    initialLocation: PdvRoutes.saleCompleted,
    overrides: overrides,
  );
}

void main() {
  testWidgets('anuncia a venda fechada e oferece os caminhos de saída', (
    WidgetTester tester,
  ) async {
    await _pumpCompleted(tester);

    expect(find.text('Venda finalizada com sucesso!'), findsWidgets);
    expect(find.text('INÍCIO'), findsOneWidget);
    expect(find.text('BALCÃO'), findsOneWidget);
    expect(find.text('DELIVERY'), findsOneWidget);
    expect(find.text('ATENDIMENTOS'), findsOneWidget);
    expect(find.text('CUPOM'), findsOneWidget);
    expect(find.text('RELATÓRIO GERENCIAL'), findsOneWidget);
    expect(find.text('ENVIAR NOTA FISCAL POR EMAIL'), findsOneWidget);
  });

  testWidgets(
    'sem Delivery/Atendimentos quando módulos opcionais estão desligados',
    (WidgetTester tester) async {
      await _pumpCompleted(
        tester,
        overrides: <Override>[
          moduleVisibilityProvider.overrideWith(
            () => FixedModuleVisibilityController(
              disabled: <String>{
                PdvModuleIds.deliveryOrders,
                PdvModuleIds.service,
              },
            ),
          ),
        ],
      );

      expect(find.text('INÍCIO'), findsOneWidget);
      expect(find.text('BALCÃO'), findsOneWidget);
      expect(find.text('DELIVERY'), findsNothing);
      expect(find.text('ATENDIMENTOS'), findsNothing);
    },
  );

  testWidgets('mostra um aviso verde de confirmação que some sozinho', (
    WidgetTester tester,
  ) async {
    await _pumpCompleted(tester);

    final SnackBar toast = tester.widget<SnackBar>(find.byType(SnackBar));
    expect(toast.backgroundColor, PdvCounterColors.payment);
    expect(toast.action, isNull);
    expect(toast.duration, const Duration(seconds: 3));
    expect(find.text('FECHAR'), findsNothing);

    expect(find.byType(SnackBar), findsOneWidget);
    // Entrada (~250ms) + duração 3s + saída — pump puro não completa a animação.
    await tester.pump(const Duration(milliseconds: 300));
    await tester.pump(const Duration(seconds: 3));
    await tester.pumpAndSettle();
    expect(find.byType(SnackBar), findsNothing);
  });

  testWidgets('zera carrinho, pagamentos, vendedor e observação ao abrir', (
    WidgetTester tester,
  ) async {
    tester.view.physicalSize = const Size(1200, 900);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);

    final ProviderContainer container = ProviderContainer(
      overrides: <Override>[
        showCustomTitleBarProvider.overrideWithValue(false),
      ],
    );
    addTearDown(container.dispose);

    container.read(counterCartProvider.notifier).addProduct(_cola);
    container
        .read(paymentEntriesProvider.notifier)
        .add(const PaymentEntry(method: _cash, amountCents: 1000));
    container.read(saleSellerProvider.notifier).select(testSellers.first);
    container.read(saleNoteProvider.notifier).setNote('Entregar após as 18h');
    expect(container.read(counterCartProvider), hasLength(1));
    expect(container.read(paymentEntriesProvider), hasLength(1));

    final GoRouter router = GoRouter(
      initialLocation: PdvRoutes.saleCompleted,
      routes: <RouteBase>[
        GoRoute(
          path: PdvRoutes.saleCompleted,
          builder: (BuildContext context, GoRouterState state) {
            return const SaleCompletedPage();
          },
        ),
        GoRoute(
          path: PdvRoutes.home,
          builder: (BuildContext context, GoRouterState state) {
            return const SizedBox.shrink();
          },
        ),
        GoRoute(
          path: PdvRoutes.counter,
          builder: (BuildContext context, GoRouterState state) {
            return const SizedBox.shrink();
          },
        ),
      ],
    );
    addTearDown(router.dispose);

    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: MaterialApp.router(theme: PdvTheme.data(), routerConfig: router),
      ),
    );
    await tester.pumpAndSettle();

    expect(container.read(counterCartProvider), isEmpty);
    expect(container.read(paymentEntriesProvider), isEmpty);
    expect(container.read(saleSellerProvider), isNull);
    expect(container.read(saleNoteProvider), isEmpty);
  });

  testWidgets('depois de limpo, a venda seguinte aceita produtos de novo', (
    WidgetTester tester,
  ) async {
    final ProviderContainer container = await _pumpCompleted(tester);

    container.read(counterCartProvider.notifier).addProduct(_cola);

    expect(container.read(counterCartProvider), hasLength(1));
    expect(container.read(counterCartProvider).single.product, _cola);
  });
}
