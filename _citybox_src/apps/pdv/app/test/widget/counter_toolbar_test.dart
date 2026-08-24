import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/counter/application/counter_cart_controller.dart';
import 'package:citybox_pdv/features/counter/application/counter_search_controller.dart';
import 'package:citybox_pdv/features/counter/domain/counter_product.dart';
import 'package:citybox_pdv/features/counter/presentation/widgets/counter_toolbar.dart';

import '../helpers/catalog_fixture.dart';

const CounterProduct _cola = CounterProduct(
  id: 'coca_1l',
  name: 'Coca Cola 1 Litro',
  priceCents: 1000,
  categoryId: 'bebidas',
);

/// Empilha a barra de ferramentas sobre uma tela inicial, para o botão de
/// cancelar ter uma rota anterior de verdade para voltar.
Future<ProviderContainer> _pumpToolbarOverHome(WidgetTester tester) async {
  tester.view.physicalSize = const Size(1200, 800);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);

  late ProviderContainer container;
  await tester.pumpWidget(
    ProviderScope(
      overrides: fixtureCatalogOverrides(),
      child: MaterialApp(
        home: Scaffold(
          body: Consumer(
            builder: (BuildContext context, WidgetRef ref, _) {
              container = ProviderScope.containerOf(context);
              return Center(
                child: ElevatedButton(
                  onPressed:
                      () => Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder:
                              (_) => const Scaffold(body: CounterToolbar()),
                        ),
                      ),
                  child: const Text('ir para o balcão'),
                ),
              );
            },
          ),
        ),
      ),
    ),
  );

  await tester.tap(find.text('ir para o balcão'));
  await tester.pumpAndSettle();

  return container;
}

void main() {
  testWidgets('tocar em cancelar abre um diálogo de confirmação', (
    WidgetTester tester,
  ) async {
    await _pumpToolbarOverHome(tester);

    await tester.tap(find.byTooltip('Cancelar venda e voltar ao início'));
    await tester.pumpAndSettle();

    expect(find.text('Cancelar venda?'), findsOneWidget);
  });

  testWidgets('confirmar limpa o carrinho e volta para o início', (
    WidgetTester tester,
  ) async {
    final ProviderContainer container = await _pumpToolbarOverHome(tester);
    container.read(counterCartProvider.notifier).addProduct(_cola);

    await tester.tap(find.byTooltip('Cancelar venda e voltar ao início'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Cancelar venda'));
    await tester.pumpAndSettle();

    expect(container.read(counterCartProvider), isEmpty);
    expect(find.text('ir para o balcão'), findsOneWidget);
  });

  testWidgets('desistir mantém o carrinho e não navega', (
    WidgetTester tester,
  ) async {
    final ProviderContainer container = await _pumpToolbarOverHome(tester);
    container.read(counterCartProvider.notifier).addProduct(_cola);

    await tester.tap(find.byTooltip('Cancelar venda e voltar ao início'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Voltar'));
    await tester.pumpAndSettle();

    expect(container.read(counterCartProvider), isNotEmpty);
    expect(find.byType(CounterToolbar), findsOneWidget);
  });

  testWidgets('digitar na busca atualiza o provider de busca', (
    WidgetTester tester,
  ) async {
    final ProviderContainer container = await _pumpToolbarOverHome(tester);

    await tester.enterText(find.widgetWithText(TextField, 'Buscar'), 'coca');
    await tester.pump();

    expect(container.read(counterSearchProvider), 'coca');
  });

  testWidgets('o campo de busca ocupa a altura inteira da barra', (
    WidgetTester tester,
  ) async {
    await _pumpToolbarOverHome(tester);

    final Finder searchField = find.descendant(
      of: find.byType(CounterToolbar),
      matching: find.byWidgetPredicate(
        (Widget w) => w is TextField && (w.decoration?.hintText == 'Buscar'),
      ),
    );
    final Rect field = tester.getRect(searchField);
    expect(field.height, PdvSizes.controlHeightSm);

    // Medir a caixa externa não discrimina o defeito — o `Row` esticado já
    // garante essa altura mesmo com o `InputDecorator` encolhido por dentro
    // (foi exatamente o que aconteceu com o campo de CPF/CNPJ antes do
    // `expands: true`). O que denuncia é onde o placeholder fica: centrado na
    // faixa com o campo esticado; colado no topo, sem.
    final Rect hint = tester.getRect(find.text('Buscar'));
    expect(hint.center.dy, closeTo(field.center.dy, 1));
  });

  testWidgets('a busca ocupa 100% da largura até o separador', (
    WidgetTester tester,
  ) async {
    await _pumpToolbarOverHome(tester);

    final Rect toolbar = tester.getRect(find.byType(CounterToolbar));
    final Finder searchField = find.byWidgetPredicate(
      (Widget w) => w is TextField && (w.decoration?.hintText == 'Buscar'),
    );
    final Rect field = tester.getRect(searchField);
    // O sulco é um widget privado do arquivo — encontrado pelo tipo, não por
    // texto, porque não tem texto nenhum.
    final Rect groove = tester.getRect(
      find.byWidgetPredicate(
        (Widget w) => w.runtimeType.toString() == '_FieldGroove',
      ),
    );

    // Sem `Padding` por fora do `TextField`, o campo começa na borda da barra
    // e vai até o sulco — não alguns pixels antes dele. Um `Padding` externo
    // encolhe a caixa **inteira** do campo, hit-test incluído; só o
    // `contentPadding` (dentro do `TextField`) deveria afastar o texto.
    expect(field.left, toolbar.left);
    expect(field.right, groove.left);
  });
}
