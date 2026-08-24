import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/core/format/pdv_currency.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/counter/application/counter_cart_controller.dart';
import 'package:citybox_pdv/features/counter/domain/counter_cart_line.dart';
import 'package:citybox_pdv/features/counter/domain/counter_product.dart';
import 'package:citybox_pdv/features/counter/presentation/widgets/counter_totals_panel.dart';
import 'package:citybox_pdv/features/delivery/domain/delivery_order.dart';
import 'package:citybox_pdv/features/payment/presentation/payment_page.dart';
import 'package:citybox_pdv/features/shared/application/shell_providers.dart';
import 'package:citybox_pdv/features/tables/application/active_account_sync.dart';
import 'package:citybox_pdv/features/tables/application/salon_controller.dart';
import 'package:citybox_pdv/features/tables/data/shared_preferences_salon_store.dart';
import 'package:citybox_pdv/features/tables/domain/dining_table.dart';
import 'package:citybox_pdv/features/tables/domain/salon_account.dart';
import 'package:citybox_pdv/features/tables/domain/salon_enums.dart';

import '../helpers/pump_with_router.dart';

const CounterProduct _cola = CounterProduct(
  id: 'coca_1l',
  name: 'Coca Cola 1 Litro',
  priceCents: 1000,
  categoryId: 'bebidas',
);

const CounterProduct _agua = CounterProduct(
  id: 'agua_com_gas',
  name: 'Água Mineral c/ Gás',
  priceCents: 300,
  categoryId: 'bebidas',
);

Future<void> _pumpPanel(
  WidgetTester tester, {
  List<Override> overrides = const <Override>[],
  Size size = const Size(500, 800),
  bool withRouter = false,
}) async {
  if (withRouter) {
    await pumpWithRouter(
      tester,
      initialLocation: '/_totals',
      size: size,
      overrides: overrides,
    );
    return;
  }

  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);

  await tester.pumpWidget(
    ProviderScope(
      overrides: <Override>[
        showCustomTitleBarProvider.overrideWithValue(false),
        ...overrides,
      ],
      child: const MaterialApp(home: Scaffold(body: CounterTotalsPanel())),
    ),
  );
}

void main() {
  testWidgets('começa em CPF, com totais zerados', (WidgetTester tester) async {
    await _pumpPanel(tester);

    expect(find.text('CPF na nota (F6)'), findsOneWidget);
    expect(find.text('CNPJ'), findsOneWidget);
    expect(find.text('Produtos'), findsOneWidget);
    expect(find.text(formatCents(0)), findsWidgets);
    expect(find.text('Ajuste da venda'), findsOneWidget);
    expect(find.text('—'), findsOneWidget);
    expect(find.text('PAGAMENTO'), findsOneWidget);
    expect(find.text('(F2)'), findsOneWidget);
  });

  testWidgets('tocar o toggle troca para CNPJ', (WidgetTester tester) async {
    await _pumpPanel(tester);

    await tester.tap(find.text('CNPJ'));
    await tester.pump();

    expect(find.text('CNPJ na nota (F6)'), findsOneWidget);
    expect(find.text('CPF'), findsOneWidget);
  });

  testWidgets('o toggle de documento ocupa a altura inteira da faixa', (
    WidgetTester tester,
  ) async {
    await _pumpPanel(tester);

    // Sem `CrossAxisAlignment.stretch` no `Row`, ele encolhe para a altura do
    // próprio conteúdo e vira uma tira fina no meio da faixa — o mesmo
    // defeito que os botões da app bar já tiveram.
    final Finder toggleInk = find.ancestor(
      of: find.text('CNPJ'),
      matching: find.byType(InkWell),
    );
    expect(tester.getSize(toggleInk).height, PdvSizes.controlHeightSm);
  });

  testWidgets(
    'o campo do documento ocupa a faixa inteira, sem encostar no topo',
    (WidgetTester tester) async {
      await _pumpPanel(tester);

      final Rect field = tester.getRect(find.byType(TextField));
      expect(field.height, PdvSizes.controlHeightSm);

      // Medir a caixa externa do `TextField` **não** prova nada: o `Expanded`
      // já a deixa com a altura da faixa enquanto o `InputDecorator` por dentro
      // se dimensiona pelo conteúdo, pinta só a metade de cima e encosta no
      // topo. Tocar na base também não revela — o `TextField` captura o gesto
      // na caixa toda de qualquer jeito.
      //
      // O que denuncia é onde o conteúdo **fica**: com o campo curto, o
      // placeholder sobe para o topo da faixa; com `expands`, ele centraliza.
      final Rect hint = tester.getRect(find.text('CPF na nota (F6)'));
      expect(hint.center.dy, closeTo(field.center.dy, 1));
    },
  );

  testWidgets('reflete o subtotal e o total do carrinho', (
    WidgetTester tester,
  ) async {
    await _pumpPanel(
      tester,
      overrides: <Override>[
        counterCartProvider.overrideWith(
          () => _FixedCart(<CounterCartLine>[
            const CounterCartLine(product: _cola, quantity: 2),
          ]),
        ),
      ],
    );

    expect(find.text(formatCents(2000)), findsWidgets);
  });

  testWidgets('carrinho vazio mostra o selo "0" ao lado de Produtos', (
    WidgetTester tester,
  ) async {
    await _pumpPanel(tester);

    expect(find.text('0'), findsOneWidget);
  });

  testWidgets(
    'o selo de Produtos soma a quantidade das linhas, não o número delas',
    (WidgetTester tester) async {
      await _pumpPanel(
        tester,
        overrides: <Override>[
          counterCartProvider.overrideWith(
            () => _FixedCart(<CounterCartLine>[
              const CounterCartLine(product: _cola, quantity: 3),
              const CounterCartLine(product: _agua, quantity: 2),
            ]),
          ),
        ],
      );

      // 2 linhas, mas 5 unidades — o selo mostra a soma das quantidades.
      expect(find.text('5'), findsOneWidget);
    },
  );

  testWidgets('carrinho vazio: botão de pagamento é amarelo', (
    WidgetTester tester,
  ) async {
    await _pumpPanel(tester);

    final Material button = tester.widget<Material>(
      find
          .ancestor(of: find.text('PAGAMENTO'), matching: find.byType(Material))
          .first,
    );

    expect(button.color, PdvCounterColors.paymentEmpty);
  });

  testWidgets('com algum produto lançado, o botão de pagamento fica verde', (
    WidgetTester tester,
  ) async {
    await _pumpPanel(
      tester,
      overrides: <Override>[
        counterCartProvider.overrideWith(
          () => _FixedCart(<CounterCartLine>[
            const CounterCartLine(product: _cola, quantity: 1),
          ]),
        ),
      ],
    );

    final Material button = tester.widget<Material>(
      find
          .ancestor(of: find.text('PAGAMENTO'), matching: find.byType(Material))
          .first,
    );

    expect(button.color, PdvCounterColors.payment);
  });

  testWidgets('com itens, o botão de pagamento abre a tela de Pagamento', (
    WidgetTester tester,
  ) async {
    await _pumpPanel(
      tester,
      // Janela real: a tela de Pagamento inteira não cabe na faixa estreita
      // que basta para testar o painel isolado.
      size: const Size(1400, 900),
      withRouter: true,
      overrides: <Override>[
        counterCartProvider.overrideWith(
          () => _FixedCart(<CounterCartLine>[
            const CounterCartLine(product: _cola, quantity: 1),
          ]),
        ),
      ],
    );

    await tester.tap(find.text('PAGAMENTO'));
    await tester.pumpAndSettle();

    expect(find.byType(PaymentPage), findsOneWidget);
  });

  testWidgets('sem itens, o botão de pagamento avisa em vez de navegar', (
    WidgetTester tester,
  ) async {
    await _pumpPanel(tester, size: const Size(1400, 900), withRouter: true);

    await tester.tap(find.text('PAGAMENTO'));
    await tester.pumpAndSettle();

    expect(find.byType(PaymentPage), findsNothing);
    expect(
      find.text('Lance ao menos um produto antes de cobrar.'),
      findsOneWidget,
    );
  });

  testWidgets('sessão delivery mostra Salvar e voltar e Pagar agora', (
    WidgetTester tester,
  ) async {
    await _pumpPanel(
      tester,
      overrides: <Override>[
        activeAccountIdProvider.overrideWith((Ref ref) => 'delivery_acc'),
        salonProvider.overrideWith(_DeliverySalonController.new),
        counterCartProvider.overrideWith(
          () => _FixedCart(<CounterCartLine>[
            const CounterCartLine(product: _cola, quantity: 1),
          ]),
        ),
      ],
    );

    expect(find.text('SALVAR E VOLTAR'), findsOneWidget);
    expect(find.text('PAGAR AGORA'), findsOneWidget);
    expect(find.text('PAGAMENTO'), findsNothing);

    final Material saveButton = tester.widget<Material>(
      find
          .ancestor(
            of: find.text('SALVAR E VOLTAR'),
            matching: find.byType(Material),
          )
          .first,
    );
    final Material payButton = tester.widget<Material>(
      find
          .ancestor(
            of: find.text('PAGAR AGORA'),
            matching: find.byType(Material),
          )
          .first,
    );
    expect(saveButton.color, PdvCounterColors.payment);
    expect(payButton.color, PdvCounterColors.surfaceStrong);
  });

  testWidgets('balcão sem conta delivery continua com um botão só', (
    WidgetTester tester,
  ) async {
    await _pumpPanel(
      tester,
      overrides: <Override>[
        counterCartProvider.overrideWith(
          () => _FixedCart(<CounterCartLine>[
            const CounterCartLine(product: _cola, quantity: 1),
          ]),
        ),
      ],
    );

    expect(find.text('PAGAMENTO'), findsOneWidget);
    expect(find.text('SALVAR E VOLTAR'), findsNothing);
    expect(find.text('PAGAR AGORA'), findsNothing);
  });
}

class _FixedCart extends CounterCartController {
  _FixedCart(this._lines);

  final List<CounterCartLine> _lines;

  @override
  List<CounterCartLine> build() => _lines;
}

class _DeliverySalonController extends SalonController {
  @override
  SalonSnapshot build() => SalonSnapshot(
    tables: const <DiningTable>[],
    accounts: <SalonAccount>[
      SalonAccount(
        id: 'delivery_acc',
        status: SalonAccountStatus.open,
        openedAt: DateTime(2026, 8, 15),
        origin: SalonOrigin.delivery,
        deliveryOrderId: 'ord-1',
      ),
    ],
    deliveryOrders: const <DeliveryOrder>[],
  );
}
