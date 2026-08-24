import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/features/delivery/application/delivery_orders_controller.dart';
import 'package:citybox_pdv/features/delivery/data/delivery_fixture.dart';
import 'package:citybox_pdv/features/delivery/domain/delivery_order.dart';
import 'package:citybox_pdv/features/delivery/presentation/widgets/delivery_kanban_board.dart';
import 'package:citybox_pdv/features/tables/application/salon_controller.dart';
import 'package:citybox_pdv/features/tables/data/shared_preferences_salon_store.dart';
import 'package:citybox_pdv/features/tables/domain/salon_account.dart';
import 'package:citybox_pdv/features/tables/domain/salon_enums.dart';
import 'package:citybox_pdv/features/delivery/presentation/widgets/delivery_orders_table.dart';
import 'package:citybox_pdv/ui/pdv_empty_state.dart';
import 'package:citybox_pdv/ui/pdv_table.dart';
import 'package:citybox_pdv/ui/pdv_table_footer.dart';

import '../helpers/pump_with_router.dart';

void main() {
  group('fixture de delivery', () {
    final DeliveryFixture fixture = buildDeliveryFixture();

    test('cobre as quatro colunas do quadro', () {
      final Map<DeliveryOrderStatus, List<DeliveryOrder>> grouped =
          groupDeliveryOrdersByColumn(fixture.orders);
      for (final DeliveryOrderStatus column in deliveryBoardColumns) {
        expect(
          grouped[column],
          isNotEmpty,
          reason: 'coluna ${column.boardLabel} ficou sem exemplo',
        );
      }
    });

    test('cobre os cinco tons da legenda', () {
      // A fixture é o que se olha para conferir se as cores continuam certas —
      // um tom sem exemplo é um tom que ninguém testa de olho.
      final Set<DeliveryTone> tones =
          fixture.orders.map((DeliveryOrder order) {
            final SalonAccount? account =
                fixture.accounts
                    .where((SalonAccount a) => a.id == order.accountId)
                    .firstOrNull;
            return deliveryToneOf(order, account);
          }).toSet();

      expect(tones, DeliveryTone.values.toSet());
    });

    test('toda conta da fixture casa com um pedido', () {
      final Set<String?> orderAccountIds =
          fixture.orders.map((DeliveryOrder o) => o.accountId).toSet();
      for (final SalonAccount account in fixture.accounts) {
        expect(orderAccountIds, contains(account.id));
      }
    });
  });

  test('emptyFixture (só testes) traz pedidos de exemplo', () {
    expect(SalonSnapshot.emptyFixture().deliveryOrders, isNotEmpty);
  });

  test('estado de produção do salão começa vazio', () {
    expect(SalonSnapshot.empty.deliveryOrders, isEmpty);
    expect(SalonSnapshot.empty.tables, isEmpty);
  });

  testWidgets('quadro aparece mesmo sem nenhum pedido', (
    WidgetTester tester,
  ) async {
    await pumpWithRouter(
      tester,
      initialLocation: PdvRoutes.deliveryOrders,
      withOpenShift: true,
      overrides: <Override>[
        // Sem nenhum pedido: as quatro colunas continuam sendo a estrutura do
        // serviço, e sumir com elas esconderia para onde os pedidos vão.
        salonProvider.overrideWith(_EmptySalonController.new),
      ],
    );
    await tester.pumpAndSettle();

    expect(find.byType(DeliveryKanbanBoard), findsOneWidget);
    expect(find.byType(PdvEmptyState), findsNothing);
    for (final DeliveryOrderStatus column in deliveryBoardColumns) {
      expect(
        find.text(column.boardLabel.toUpperCase()),
        findsOneWidget,
        reason: 'coluna ${column.boardLabel} sumiu com o quadro vazio',
      );
    }
  });

  testWidgets('modo Tabela mostra o cabeçalho de 7 colunas e o rodapé', (
    WidgetTester tester,
  ) async {
    final ProviderContainer container = await pumpWithRouter(
      tester,
      initialLocation: PdvRoutes.deliveryOrders,
      withOpenShift: true,
    );
    container
        .read(deliveryViewModeProvider.notifier)
        .set(DeliveryViewMode.table);
    // `pump`, e não `pumpAndSettle`: a barra de carregamento é indeterminada e
    // anima para sempre, então "assentar" nunca acontece.
    await tester.pump();

    for (final PdvTableColumn column in deliveryOrdersColumns) {
      expect(
        find.text(column.label),
        findsOneWidget,
        reason: 'coluna ${column.label}',
      );
    }
    expect(find.byType(PdvTableFooter), findsOneWidget);
  });

  testWidgets('tabela carrega enquanto o salão não hidratou', (
    WidgetTester tester,
  ) async {
    final ProviderContainer container = await pumpWithRouter(
      tester,
      initialLocation: PdvRoutes.deliveryOrders,
      withOpenShift: true,
    );
    container
        .read(deliveryViewModeProvider.notifier)
        .set(DeliveryViewMode.table);
    // `pump`, e não `pumpAndSettle`: a barra de carregamento é indeterminada e
    // anima para sempre, então "assentar" nunca acontece.
    await tester.pump();

    // `hydrate()` não roda no harness de teste, então o salão continua não
    // hidratado — é exatamente o estado que a barra sinaliza.
    expect(container.read(salonHydratedProvider), isFalse);
    expect(find.byType(LinearProgressIndicator), findsOneWidget);
  });

  testWidgets('quadro mostra os pedidos da fixture', (
    WidgetTester tester,
  ) async {
    await pumpWithRouter(
      tester,
      initialLocation: PdvRoutes.deliveryOrders,
      withOpenShift: true,
      overrides: <Override>[
        salonProvider.overrideWith(_FixtureSalonController.new),
      ],
    );
    await tester.pumpAndSettle();

    expect(find.byType(DeliveryKanbanBoard), findsOneWidget);
    expect(find.text('Maria Souza'), findsOneWidget);
  });
}

/// Salão sem pedido nenhum — só as mesas.
class _EmptySalonController extends SalonController {
  @override
  SalonSnapshot build() {
    return SalonSnapshot(
      tables: SalonSnapshot.emptyFixture().tables,
      accounts: const <SalonAccount>[],
      deliveryOrders: const <DeliveryOrder>[],
    );
  }
}

/// Pedidos de exemplo — override explícito (produção não semeia).
class _FixtureSalonController extends SalonController {
  @override
  SalonSnapshot build() => SalonSnapshot.emptyFixture();
}
