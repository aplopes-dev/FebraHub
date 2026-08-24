import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/core/theme/pdv_theme.dart';
import 'package:citybox_pdv/features/counter/application/counter_cart_controller.dart';
import 'package:citybox_pdv/features/counter/domain/counter_cart_line.dart';
import 'package:citybox_pdv/features/counter/domain/counter_product.dart';
import 'package:citybox_pdv/features/payment/application/sale_note_controller.dart';
import 'package:citybox_pdv/features/payment/application/sale_seller_controller.dart';
import 'package:citybox_pdv/features/payment/application/terminal_sellers_controller.dart';
import 'package:citybox_pdv/features/payment/data/seller_catalog.dart';
import 'package:citybox_pdv/features/payment/domain/seller.dart';
import 'package:citybox_pdv/features/payment/presentation/payment_page.dart';
import 'package:citybox_pdv/features/shared/application/shell_providers.dart';

/// Vendedor e observação da venda, pelos diálogos da app bar de Pagamento.

const CounterProduct _cola = CounterProduct(
  id: 'coca_1l',
  name: 'Coca Cola 1 Litro',
  priceCents: 8490,
  categoryId: 'bebidas',
);

const Seller _tatiane = Seller(
  id: 'seller_09',
  code: '09',
  name: 'Tatiane Ribeiro',
);

class _FixedCart extends CounterCartController {
  _FixedCart(this._lines);

  final List<CounterCartLine> _lines;

  @override
  List<CounterCartLine> build() => _lines;
}

Future<ProviderContainer> _pumpPayment(WidgetTester tester) async {
  tester.view.physicalSize = const Size(1400, 900);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);

  late ProviderContainer container;
  await tester.pumpWidget(
    ProviderScope(
      overrides: <Override>[
        showCustomTitleBarProvider.overrideWithValue(false),
        counterCartProvider.overrideWith(
          () => _FixedCart(const <CounterCartLine>[
            CounterCartLine(product: _cola, quantity: 1),
          ]),
        ),
        terminalSellersProvider.overrideWith(
          (Ref ref) async => <Seller>[...testSellers, _tatiane],
        ),
      ],
      child: MaterialApp(
        theme: PdvTheme.data(),
        home: Consumer(
          builder: (BuildContext context, WidgetRef ref, _) {
            container = ProviderScope.containerOf(context);
            return const PaymentPage();
          },
        ),
      ),
    ),
  );
  await tester.pumpAndSettle();
  return container;
}

/// O campo de texto **do diálogo aberto** — a tela por trás tem os seus
/// (documento na nota), e `find.byType(TextField)` sozinho pegaria os dois.
Finder _dialogField() => find.descendant(
  of: find.byType(Dialog),
  matching: find.byType(TextField),
);

Future<void> _openNoteDialog(WidgetTester tester, {String? current}) async {
  await tester.tap(
    find.byTooltip(
      current == null ? 'Observação da venda' : 'Observação: $current',
    ),
  );
  await tester.pumpAndSettle();
}

Future<void> _openSellerDialog(WidgetTester tester) async {
  await tester.tap(find.byTooltip('Vendedor'));
  await tester.pumpAndSettle();
}

void main() {
  group('observação da venda', () {
    testWidgets('anotar pelo diálogo mostra o texto no fechamento', (
      WidgetTester tester,
    ) async {
      final ProviderContainer container = await _pumpPayment(tester);

      await _openNoteDialog(tester);
      expect(find.text('Observação da venda'), findsOneWidget);

      await tester.enterText(_dialogField(), 'Entregar após as 18h');
      await tester.tap(find.text('Salvar'));
      await tester.pumpAndSettle();

      expect(container.read(saleNoteProvider), 'Entregar após as 18h');
      // O que interessa ao operador: a anotação está na tela, no painel de
      // fechamento — não escondida atrás do botão que a criou.
      expect(find.text('OBSERVAÇÃO'), findsOneWidget);
      expect(find.text('Entregar após as 18h'), findsOneWidget);
    });

    testWidgets('cancelar o diálogo não mexe na observação já anotada', (
      WidgetTester tester,
    ) async {
      final ProviderContainer container = await _pumpPayment(tester);
      container.read(saleNoteProvider.notifier).setNote('Cliente pediu nota');
      await tester.pumpAndSettle();

      await _openNoteDialog(tester, current: 'Cliente pediu nota');
      await tester.enterText(_dialogField(), 'texto que será descartado');
      await tester.tap(find.text('Cancelar'));
      await tester.pumpAndSettle();

      expect(container.read(saleNoteProvider), 'Cliente pediu nota');
    });

    testWidgets('remover apaga a observação e some com a faixa', (
      WidgetTester tester,
    ) async {
      final ProviderContainer container = await _pumpPayment(tester);
      container.read(saleNoteProvider.notifier).setNote('Cliente pediu nota');
      await tester.pumpAndSettle();
      expect(find.text('OBSERVAÇÃO'), findsOneWidget);

      await _openNoteDialog(tester, current: 'Cliente pediu nota');
      await tester.tap(find.text('Remover'));
      await tester.pumpAndSettle();

      expect(container.read(saleNoteProvider), isEmpty);
      expect(find.text('OBSERVAÇÃO'), findsNothing);
    });

    testWidgets('só espaços não conta como observação', (
      WidgetTester tester,
    ) async {
      final ProviderContainer container = await _pumpPayment(tester);

      await _openNoteDialog(tester);
      await tester.enterText(_dialogField(), '    ');
      await tester.tap(find.text('Salvar'));
      await tester.pumpAndSettle();

      expect(container.read(saleNoteProvider), isEmpty);
      expect(find.text('OBSERVAÇÃO'), findsNothing);
    });
  });

  group('vendedor da venda', () {
    testWidgets('buscar e escolher põe o nome no botão da app bar', (
      WidgetTester tester,
    ) async {
      final ProviderContainer container = await _pumpPayment(tester);

      await _openSellerDialog(tester);
      // Sem busca, a equipe inteira está na lista.
      expect(find.text('Rafael Souza Lima'), findsOneWidget);

      // Sem acento de propósito: é como o operador digita.
      await tester.enterText(_dialogField(), 'jessica');
      await tester.pumpAndSettle();
      expect(find.text('Rafael Souza Lima'), findsNothing);

      await tester.tap(find.text('Jéssica Andrade'));
      await tester.pumpAndSettle();

      expect(container.read(saleSellerProvider)?.code, '03');
      // O rótulo da app bar sai em maiúsculas, como os demais botões dela.
      expect(find.text('JÉSSICA ANDRADE'), findsOneWidget);
    });

    testWidgets('busca sem resultado avisa em vez de mostrar lista vazia', (
      WidgetTester tester,
    ) async {
      await _pumpPayment(tester);

      await _openSellerDialog(tester);
      await tester.enterText(_dialogField(), 'zzz');
      await tester.pumpAndSettle();

      expect(find.text('Nenhum vendedor encontrado'), findsOneWidget);
    });

    testWidgets('ENTER escolhe o primeiro resultado da busca', (
      WidgetTester tester,
    ) async {
      final ProviderContainer container = await _pumpPayment(tester);

      await _openSellerDialog(tester);
      await tester.enterText(_dialogField(), 'silva');
      await tester.pumpAndSettle();
      await tester.testTextInput.receiveAction(TextInputAction.search);
      await tester.pumpAndSettle();

      expect(container.read(saleSellerProvider)?.name, 'Marcos Antônio Silva');
    });

    testWidgets('cancelar não apaga o vendedor já escolhido', (
      WidgetTester tester,
    ) async {
      final ProviderContainer container = await _pumpPayment(tester);

      await _openSellerDialog(tester);
      // Busca antes de escolher: a equipe não cabe inteira na altura do
      // diálogo, e é assim que se chega a quem está no fim da lista.
      await tester.enterText(_dialogField(), 'tatiane');
      await tester.pumpAndSettle();
      await tester.tap(find.text('Tatiane Ribeiro'));
      await tester.pumpAndSettle();

      // Reabre pelo botão, que agora leva o nome do vendedor no tooltip.
      await tester.tap(find.byTooltip('Vendedor: 09 — Tatiane Ribeiro'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('CANCELAR (ESC)'));
      await tester.pumpAndSettle();

      expect(container.read(saleSellerProvider)?.name, 'Tatiane Ribeiro');
    });

    testWidgets('"Sem vendedor" tira a atribuição da venda', (
      WidgetTester tester,
    ) async {
      final ProviderContainer container = await _pumpPayment(tester);

      await _openSellerDialog(tester);
      // Busca antes de escolher: a equipe não cabe inteira na altura do
      // diálogo, e é assim que se chega a quem está no fim da lista.
      await tester.enterText(_dialogField(), 'tatiane');
      await tester.pumpAndSettle();
      await tester.tap(find.text('Tatiane Ribeiro'));
      await tester.pumpAndSettle();

      await tester.tap(find.byTooltip('Vendedor: 09 — Tatiane Ribeiro'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Sem vendedor'));
      await tester.pumpAndSettle();

      expect(container.read(saleSellerProvider), isNull);
      expect(find.text('TATIANE RIBEIRO'), findsNothing);
    });
  });
}
