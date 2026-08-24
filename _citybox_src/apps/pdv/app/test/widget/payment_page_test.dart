import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/core/format/pdv_currency.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/cash/application/cash_shift_controller.dart';
import 'package:citybox_pdv/features/counter/application/counter_cart_controller.dart';
import 'package:citybox_pdv/features/counter/domain/counter_cart_line.dart';
import 'package:citybox_pdv/features/counter/domain/counter_product.dart';
import 'package:citybox_pdv/features/payment/application/complete_sale.dart';
import 'package:citybox_pdv/features/payment/application/payment_entries_controller.dart';
import 'package:citybox_pdv/features/payment/data/payment_catalog.dart';
import 'package:citybox_pdv/features/payment/presentation/sale_completed_page.dart';

import '../helpers/fake_pos_sales_api.dart';
import '../helpers/pump_with_router.dart';

const CounterProduct _cola = CounterProduct(
  id: '22222222-2222-4222-8222-222222222201',
  name: 'Coca Cola 1 Litro',
  priceCents: 8490,
  categoryId: 'bebidas',
);

class _FixedCart extends CounterCartController {
  _FixedCart(this._lines);

  final List<CounterCartLine> _lines;

  @override
  List<CounterCartLine> build() => _lines;
}

Future<ProviderContainer> _pumpPayment(
  WidgetTester tester, {
  List<CounterCartLine> lines = const <CounterCartLine>[
    CounterCartLine(product: _cola, quantity: 1),
  ],
  Size size = const Size(1400, 900),
  List<Override> extraOverrides = const <Override>[],
}) {
  return pumpWithRouter(
    tester,
    initialLocation: PdvRoutes.payment,
    size: size,
    overrides: <Override>[
      counterCartProvider.overrideWith(() => _FixedCart(lines)),
      ...extraOverrides,
    ],
  );
}

void main() {
  testWidgets('mostra as formas de pagamento da loja na coluna da esquerda', (
    WidgetTester tester,
  ) async {
    await _pumpPayment(tester);

    expect(find.text('Dinheiro'), findsOneWidget);
    expect(find.text('Cartão de Crédito'), findsOneWidget);
    expect(find.text('Cartão de Débito'), findsOneWidget);
    expect(find.text('PIX'), findsOneWidget);
    expect(find.text('VALE FUNC'), findsOneWidget);
  });

  testWidgets(
    'sem pagamento lançado, a lista da direita avisa que está vazia',
    (WidgetTester tester) async {
      await _pumpPayment(tester);

      expect(find.text('Nenhum pagamento adicionado'), findsOneWidget);
      expect(find.text('FORMA DE PAGAMENTO'), findsOneWidget);
      expect(find.text('VALOR'), findsOneWidget);
    },
  );

  testWidgets('o resumo mostra total, recebido, a receber e troco', (
    WidgetTester tester,
  ) async {
    await _pumpPayment(tester);

    expect(find.text('Produtos'), findsOneWidget);
    expect(find.text('Desconto'), findsOneWidget);
    expect(find.text('Total'), findsOneWidget);
    expect(find.text('Recebido'), findsOneWidget);
    expect(find.text('A receber'), findsOneWidget);
    expect(find.text('Troco'), findsOneWidget);
    expect(find.text('CPF na nota (F6)'), findsOneWidget);
  });

  testWidgets('digitar no teclado numérico compõe o valor em centavos', (
    WidgetTester tester,
  ) async {
    await _pumpPayment(tester);

    await tester.tap(find.widgetWithText(InkWell, '5'));
    await tester.pump();
    await tester.tap(find.widgetWithText(InkWell, '0'));
    await tester.pump();

    expect(find.text(formatCents(50)), findsWidgets);
  });

  testWidgets('"Receber valor total" preenche o que falta receber', (
    WidgetTester tester,
  ) async {
    await _pumpPayment(tester);

    expect(find.textContaining('RECEBER VALOR TOTAL'), findsOneWidget);

    await tester.tap(find.textContaining('RECEBER VALOR TOTAL'));
    await tester.pump();

    expect(find.text(formatCents(8490)), findsWidgets);
  });

  testWidgets('receber lança o pagamento na lista da direita', (
    WidgetTester tester,
  ) async {
    final ProviderContainer container = await _pumpPayment(tester);

    await tester.tap(find.textContaining('RECEBER VALOR TOTAL'));
    await tester.pump();
    await tester.tap(find.widgetWithText(InkWell, 'RECEBER'));
    await tester.pump();

    expect(container.read(paymentEntriesProvider), hasLength(1));
    expect(container.read(paymentEntriesProvider).single.amountCents, 8490);
    expect(find.text('Nenhum pagamento adicionado'), findsNothing);
  });

  testWidgets('depois de receber, o campo volta a zero para o próximo', (
    WidgetTester tester,
  ) async {
    await _pumpPayment(
      tester,
      lines: const <CounterCartLine>[
        CounterCartLine(product: _cola, quantity: 2),
      ],
    );

    await tester.tap(find.textContaining('RECEBER VALOR TOTAL'));
    await tester.pump();
    await tester.tap(find.widgetWithText(InkWell, 'RECEBER'));
    await tester.pump();

    expect(find.text(formatCents(0)), findsWidgets);
  });

  testWidgets('cartão de crédito pede a bandeira antes de mostrar o teclado', (
    WidgetTester tester,
  ) async {
    await _pumpPayment(tester);

    await tester.tap(find.text('Cartão de Crédito'));
    await tester.pump();

    expect(find.text('Escolha a bandeira'), findsOneWidget);
    expect(find.text('MasterCard'), findsOneWidget);
    expect(find.widgetWithText(InkWell, 'RECEBER'), findsNothing);

    await tester.tap(find.text('MasterCard'));
    await tester.pump();

    expect(find.text('Escolha a bandeira'), findsNothing);
    expect(find.widgetWithText(InkWell, 'RECEBER'), findsOneWidget);
  });

  testWidgets('crédito mostra o seletor de parcelas; dinheiro não', (
    WidgetTester tester,
  ) async {
    await _pumpPayment(tester);

    expect(
      find.byKey(const ValueKey<String>('payment_installments_select')),
      findsNothing,
    );

    await tester.tap(find.text('Cartão de Crédito'));
    await tester.pump();
    await tester.tap(find.text('Visa'));
    await tester.pump();

    expect(
      find.byKey(const ValueKey<String>('payment_installments_select')),
      findsOneWidget,
    );
  });

  testWidgets('débito tem bandeira mas não parcela', (
    WidgetTester tester,
  ) async {
    await _pumpPayment(tester);

    await tester.tap(find.text('Cartão de Débito'));
    await tester.pump();
    expect(find.text('Escolha a bandeira'), findsOneWidget);

    await tester.tap(find.text('Visa'));
    await tester.pump();

    expect(
      find.byKey(const ValueKey<String>('payment_installments_select')),
      findsNothing,
    );
  });

  testWidgets('a venda pode ser paga em duas formas diferentes', (
    WidgetTester tester,
  ) async {
    final ProviderContainer container = await _pumpPayment(tester);

    await tester.tap(find.widgetWithText(InkWell, '+50'));
    await tester.pump();
    await tester.tap(find.widgetWithText(InkWell, 'RECEBER'));
    await tester.pump();

    await tester.tap(find.text('PIX'));
    await tester.pump();
    await tester.tap(find.textContaining('RECEBER VALOR TOTAL'));
    await tester.pump();
    await tester.tap(find.widgetWithText(InkWell, 'RECEBER'));
    await tester.pump();

    final List<dynamic> entries = container.read(paymentEntriesProvider);
    expect(entries, hasLength(2));
    expect(container.read(paymentEntriesProvider)[0].method.id, fixturePaymentMethods[0].id);
    expect(container.read(paymentEntriesProvider)[1].method.id, fixturePaymentMethods[3].id);
  });

  testWidgets('finalizar só fica verde quando o recebido cobre o total', (
    WidgetTester tester,
  ) async {
    await _pumpPayment(tester);

    Material finalizeButton() => tester.widget<Material>(
      find
          .ancestor(of: find.text('FINALIZAR'), matching: find.byType(Material))
          .first,
    );

    expect(finalizeButton().color, PdvCounterColors.surfaceStrong);

    await tester.tap(find.textContaining('RECEBER VALOR TOTAL'));
    await tester.pump();
    await tester.tap(find.widgetWithText(InkWell, 'RECEBER'));
    await tester.pump();

    expect(finalizeButton().color, PdvCounterColors.payment);
  });

  testWidgets('finalizar online grava no turno e abre cupom não fiscal', (
    WidgetTester tester,
  ) async {
    final FakePosSalesApi api = FakePosSalesApi();
    final ProviderContainer container = await _pumpPayment(
      tester,
      extraOverrides: <Override>[
        posSalesApiProvider.overrideWithValue(api),
      ],
    );

    await tester.tap(find.textContaining('RECEBER VALOR TOTAL'));
    await tester.pump();
    await tester.tap(find.widgetWithText(InkWell, 'RECEBER'));
    await tester.pump();
    await tester.tap(find.text('FINALIZAR'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 50));

    expect(api.createCalls, 1);
    expect(container.read(cashShiftProvider)!.sales, hasLength(1));
    expect(find.byType(SaleCompletedPage), findsOneWidget);
    expect(find.text('CUPOM NÃO FISCAL'), findsOneWidget);

    await tester.tap(find.text('Fechar'));
    await tester.pumpAndSettle();

    expect(find.text('Venda finalizada com sucesso!'), findsWidgets);
  });

  testWidgets('falha no POST não grava venda nem sai de Pagamento', (
    WidgetTester tester,
  ) async {
    final FakePosSalesApi api = FakePosSalesApi(throwOffline: true);
    final ProviderContainer container = await _pumpPayment(
      tester,
      extraOverrides: <Override>[
        posSalesApiProvider.overrideWithValue(api),
      ],
    );

    await tester.tap(find.textContaining('RECEBER VALOR TOTAL'));
    await tester.pump();
    await tester.tap(find.widgetWithText(InkWell, 'RECEBER'));
    await tester.pump();
    await tester.tap(find.text('FINALIZAR'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 50));

    expect(api.createCalls, 1);
    expect(container.read(cashShiftProvider)!.sales, isEmpty);
    expect(container.read(paymentEntriesProvider), hasLength(1));
    expect(find.byType(SaleCompletedPage), findsNothing);
    expect(find.textContaining('Sem conexão'), findsOneWidget);
  });

  testWidgets('remover um pagamento devolve o valor ao que falta receber', (
    WidgetTester tester,
  ) async {
    final ProviderContainer container = await _pumpPayment(tester);

    await tester.tap(find.textContaining('RECEBER VALOR TOTAL'));
    await tester.pump();
    await tester.tap(find.widgetWithText(InkWell, 'RECEBER'));
    await tester.pump();
    expect(container.read(paymentEntriesProvider), hasLength(1));

    await tester.tap(find.byTooltip('Remover Dinheiro'));
    await tester.pump();

    expect(container.read(paymentEntriesProvider), isEmpty);
    expect(find.text('Nenhum pagamento adicionado'), findsOneWidget);
  });
}
