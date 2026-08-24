import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/core/theme/pdv_theme.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/counter/presentation/counter_page.dart';
import 'package:citybox_pdv/features/counter/presentation/widgets/counter_app_bar.dart';
import 'package:citybox_pdv/features/counter/presentation/widgets/counter_cart_table.dart';
import 'package:citybox_pdv/features/counter/presentation/widgets/counter_category_sidebar.dart';
import 'package:citybox_pdv/features/counter/presentation/widgets/counter_product_grid.dart';
import 'package:citybox_pdv/features/counter/presentation/widgets/counter_toolbar.dart';
import 'package:citybox_pdv/features/counter/presentation/widgets/counter_totals_panel.dart';
import 'package:citybox_pdv/features/shared/application/shell_providers.dart';

import '../helpers/catalog_fixture.dart';

/// O PDV tem um tema só e ele é escuro — não há modo para alternar. Estas
/// provas travam os valores que o produto especificou e a hierarquia de
/// superfícies que sustenta a leitura da tela.
void main() {
  testWidgets('a coluna de categorias é #414141', (WidgetTester tester) async {
    tester.view.physicalSize = const Size(400, 800);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(
      ProviderScope(
        overrides: fixtureCatalogOverrides(),
        child: MaterialApp(
          theme: PdvTheme.data(),
          home: const Scaffold(body: CounterCategorySidebar()),
        ),
      ),
    );

    final ColoredBox box = tester.widget<ColoredBox>(
      find
          .descendant(
            of: find.byType(CounterCategorySidebar),
            matching: find.byType(ColoredBox),
          )
          .first,
    );

    expect(box.color, const Color(0xFF414141));
  });

  test('o fundo do sistema é #2F2F2F e a app bar é #212121', () {
    expect(PdvColors.background, const Color(0xFF2F2F2F));
    expect(PdvAppBarColors.background, const Color(0xFF212121));
    expect(PdvColors.surface, const Color(0xFF404040));
  });

  test('o fundo da grade de produtos é #303030, independente do sistema', () {
    // Planos diferentes: `PdvColors.background` é a moldura (app bar e a
    // margem ao redor da área operacional); este é o fundo do conteúdo,
    // atrás da grade. Já dividiram o mesmo valor antes — separados agora, de
    // propósito, para um mudar sem arrastar o outro.
    expect(PdvCounterColors.background, const Color(0xFF303030));
    expect(PdvCounterColors.background, isNot(PdvColors.background));
  });

  test('campo de texto tem fundo #4A4A4A', () {
    expect(PdvColors.inputFill, const Color(0xFF4A4A4A));
    expect(PdvTheme.data().inputDecorationTheme.fillColor, PdvColors.inputFill);
  });

  test('o tema é escuro, e só existe um', () {
    expect(PdvTheme.data().brightness, Brightness.dark);
    // Texto claro sobre superfície escura: se `onSurface` voltar a ser escuro,
    // o texto digitado num `TextField` some dentro do campo — o Material 3 tira
    // a cor dele daqui, não do `textTheme`.
    expect(PdvTheme.data().colorScheme.onSurface, PdvColors.textPrimary);
  });

  test('as superfícies sobem a partir do fundo, nunca descem', () {
    // Em tema escuro é a luz que marca elevação. Uma superfície "elevada" mais
    // escura que o fundo afunda em vez de subir, e a hierarquia se inverte sem
    // ninguém notar até a tela ficar montada.
    int luminance(Color c) =>
        (c.r * 255).round() + (c.g * 255).round() + (c.b * 255).round();

    expect(
      luminance(PdvCounterColors.surfaceStrong),
      greaterThan(luminance(PdvCounterColors.background)),
    );
    expect(
      luminance(PdvCounterColors.surfaceHover),
      greaterThan(luminance(PdvCounterColors.surfaceStrong)),
    );
    expect(
      luminance(PdvCounterColors.categorySurface),
      greaterThan(luminance(PdvCounterColors.background)),
    );

    // A app bar é mais escura que o fundo do sistema — moldura, não o mesmo
    // plano do conteúdo.
    expect(
      luminance(PdvAppBarColors.background),
      lessThan(luminance(PdvColors.background)),
    );
    expect(
      luminance(PdvColors.surface),
      greaterThan(luminance(PdvColors.background)),
    );

    // A barra de título é a única que **afunda** abaixo da app bar: ela
    // pertence à janela, não ao app.
    expect(
      luminance(PdvTitleBarColors.background),
      lessThan(luminance(PdvAppBarColors.background)),
    );
  });

  testWidgets(
    'a barra de ferramentas e o resto do conteúdo vão de ponta a ponta',
    (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1280, 800);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);

      await tester.pumpWidget(
        ProviderScope(
          overrides: <Override>[
            showCustomTitleBarProvider.overrideWithValue(false),
            ...fixtureCatalogOverrides(),
          ],
          child: MaterialApp(theme: PdvTheme.data(), home: const CounterPage()),
        ),
      );
      await tester.pumpAndSettle();

      final Rect appBar = tester.getRect(find.byType(CounterAppBar));
      final Rect toolbar = tester.getRect(find.byType(CounterToolbar));
      final Rect sidebar = tester.getRect(find.byType(CounterCategorySidebar));
      final Rect grid = tester.getRect(find.byType(CounterProductGrid));
      final Size screen = tester.getSize(find.byType(MaterialApp));

      // Topo colado na app bar: quem fecha ali é o traço, não uma margem.
      expect(toolbar.top, appBar.bottom);
      // A barra encosta nas duas bordas da janela.
      expect(toolbar.left, 0);
      expect(toolbar.right, screen.width);
      // O resto do conteúdo também: sem margem nenhuma sobrando entre ele e
      // a tela — o fundo da área operacional já não se distingue do fundo
      // dos próprios blocos, então uma margem ali não separava nada.
      expect(sidebar.left, 0);
      expect(grid.bottom, screen.height);
    },
  );

  testWidgets('a área operacional fecha o topo com o traço do cabeçalho', (
    WidgetTester tester,
  ) async {
    tester.view.physicalSize = const Size(1280, 800);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(
      ProviderScope(
        overrides: <Override>[
          showCustomTitleBarProvider.overrideWithValue(false),
          ...fixtureCatalogOverrides(),
        ],
        child: MaterialApp(theme: PdvTheme.data(), home: const CounterPage()),
      ),
    );
    await tester.pumpAndSettle();

    final Rect toolbar = tester.getRect(find.byType(CounterToolbar));
    final Rect sidebar = tester.getRect(find.byType(CounterCategorySidebar));

    // O traço é uma faixa própria, com espaço reservado — não uma borda
    // desenhada por cima. Pintada por cima, ela recortava o contorno de foco
    // do campo de CPF/CNPJ, que encosta no topo do painel de totais. Que o
    // conteúdo comece exatamente `borderWidthFocus` abaixo da barra é a prova
    // de que o espaço é dele.
    expect(sidebar.top - toolbar.bottom, PdvSizes.borderWidthFocus);

    // E de que ele **pinta** esse espaço. Procurar um `ColoredBox` com a cor
    // do traço não basta: desde que o fundo do sistema passou a usar a mesma
    // cor da app bar, vários casam. E procurar só pela cor já deixou passar
    // uma versão em que o traço estava na árvore com largura zero, sem pintar
    // um pixel — por isso a busca é pela **geometria**.
    final Iterable<RenderBox> edges = find
        .byWidgetPredicate(
          (Widget w) => w is ColoredBox && w.color == PdvCounterColors.topEdge,
        )
        .evaluate()
        .map((Element e) => e.renderObject! as RenderBox)
        .where(
          (RenderBox box) =>
              box.size.height == PdvSizes.borderWidthFocus &&
              box.localToGlobal(Offset.zero).dy == toolbar.bottom,
        );

    expect(edges, hasLength(1));
    expect(
      edges.single.size.width,
      toolbar.width,
      reason: 'traço precisa cruzar a área de conteúdo inteira',
    );
    expect(PdvCounterColors.topEdge, PdvAppBarColors.background);

    // Ninguém pinta decoração por cima da área operacional — é isso que
    // impede o recorte voltar por outro caminho.
    final Iterable<DecoratedBox> overlays = tester
        .widgetList<DecoratedBox>(find.byType(DecoratedBox))
        .where(
          (DecoratedBox box) => box.position == DecorationPosition.foreground,
        );
    expect(overlays, isEmpty);
  });

  testWidgets(
    'lista de itens lançados e painel de totais têm o fundo da grade',
    (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1280, 800);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);

      await tester.pumpWidget(
        ProviderScope(
          overrides: <Override>[
            showCustomTitleBarProvider.overrideWithValue(false),
            ...fixtureCatalogOverrides(),
          ],
          child: MaterialApp(theme: PdvTheme.data(), home: const CounterPage()),
        ),
      );
      await tester.pumpAndSettle();

      final ColoredBox cartBox = tester.widget<ColoredBox>(
        find
            .descendant(
              of: find.byType(CounterCartTable),
              matching: find.byType(ColoredBox),
            )
            .first,
      );
      final DecoratedBox totalsBox = tester.widget<DecoratedBox>(
        find
            .descendant(
              of: find.byType(CounterTotalsPanel),
              matching: find.byType(DecoratedBox),
            )
            .first,
      );

      expect(cartBox.color, PdvCounterColors.background);
      expect(
        (totalsBox.decoration as BoxDecoration).color,
        PdvCounterColors.background,
      );
    },
  );

  test('o botão de pagamento é o verde de sucesso, com texto escuro', () {
    expect(PdvCounterColors.payment, PdvColors.success);
    expect(PdvCounterColors.onPayment, PdvColors.background);
    // Não é só reaproveitar dois tokens quaisquer: o texto claro que estava
    // aqui antes media ~1,8:1 de contraste sobre este verde — bem abaixo do
    // mínimo legível (falha até o AA de texto grande, que já é o piso mais
    // baixo do WCAG).
    expect(PdvCounterColors.onPayment, isNot(PdvColors.onBrand));
  });

  testWidgets('o texto do botão de pagamento fica centralizado na faixa', (
    WidgetTester tester,
  ) async {
    tester.view.physicalSize = const Size(1280, 800);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(
      ProviderScope(
        overrides: <Override>[
          showCustomTitleBarProvider.overrideWithValue(false),
          ...fixtureCatalogOverrides(),
        ],
        child: MaterialApp(theme: PdvTheme.data(), home: const CounterPage()),
      ),
    );
    await tester.pumpAndSettle();

    // `CrossAxisAlignment.baseline` (usado para alinhar "PAGAMENTO" e "(F2)"
    // entre si) dimensiona a `Row` pela altura do texto, não da faixa — sem
    // o `Center` por fora, essa caixa menor nasce colada no topo dos 56 px
    // do botão. O que prova o centro é a posição do texto, não a existência
    // de um `Center` na árvore.
    final Rect button = tester.getRect(
      find.ancestor(of: find.text('PAGAMENTO'), matching: find.byType(InkWell)),
    );
    final Rect text = tester.getRect(find.text('PAGAMENTO'));

    expect(text.center.dy, closeTo(button.center.dy, 1));
  });

  testWidgets('a grade de produtos tem altura máxima e fica colada no rodapé', (
    WidgetTester tester,
  ) async {
    Future<Rect> pumpAndGetGridRect(double height) async {
      tester.view.physicalSize = Size(1280, height);
      tester.view.devicePixelRatio = 1;
      await tester.pumpWidget(
        ProviderScope(
          overrides: <Override>[
            showCustomTitleBarProvider.overrideWithValue(false),
            ...fixtureCatalogOverrides(),
          ],
          child: MaterialApp(theme: PdvTheme.data(), home: const CounterPage()),
        ),
      );
      await tester.pumpAndSettle();
      return tester.getRect(find.byType(CounterProductGrid));
    }

    addTearDown(tester.view.reset);

    final Rect shortWindow = await pumpAndGetGridRect(800);
    final Rect tallWindow = await pumpAndGetGridRect(1400);

    // O teto trava a altura da grade — ela não cresce junto com a janela,
    // diferente de tudo o mais nesta tela.
    expect(tallWindow.height, shortWindow.height);

    // "Colada no rodapé": sem margem nenhuma, a base da grade encosta
    // exatamente na base da janela nos dois tamanhos.
    expect(shortWindow.top + shortWindow.height, closeTo(800, 1));
    expect(tallWindow.top + tallWindow.height, closeTo(1400, 1));
  });
}
