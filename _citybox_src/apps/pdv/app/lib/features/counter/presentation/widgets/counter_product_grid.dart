import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/core/format/pdv_currency.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/catalog/application/catalog_controller.dart';
import 'package:citybox_pdv/features/counter/application/counter_category_controller.dart';
import 'package:citybox_pdv/features/counter/application/counter_search_controller.dart';
import 'package:citybox_pdv/features/counter/domain/counter_product.dart';
import 'package:citybox_pdv/features/counter/presentation/widgets/product_launch_sheet.dart';
import 'package:citybox_pdv/ui/pdv_empty_state.dart';
import 'package:citybox_pdv/ui/pdv_loading_state.dart';

/// Vão entre botões e nas bordas da grade.
const double _gap = PdvSpacing.xs + 2;

/// Faixa de largura do botão de produto — o mesmo intervalo em toda a grade,
/// não um valor calculado por fila. É o que padroniza o botão: 6 produtos
/// numa fila cheia e 2 na última não têm tamanhos diferentes um do outro,
/// como se cada fila decidisse seu próprio grid.
///
/// [_minButtonWidth] é o piso que decide quantas colunas cabem (ver
/// [CounterProductGrid._columnsFor]); [_maxButtonWidth] é só uma trava de
/// segurança para janelas ultra largas, não o valor que o botão normalmente
/// assume. Um teto baixo (200 px) deixava vão vazio à direita da fila: a
/// largura real por coluna passava dele, o botão ficava preso no teto, e a
/// fila inteira (colunas × botão) media menos que a largura disponível. Com
/// o teto alto, o botão ocupa a divisão real do espaço quase sempre — só
/// satura numa janela largíssima.
const double _minButtonWidth = 150;
const double _maxButtonWidth = 320;

/// Teto de colunas por fila — no máximo 6 produtos lado a lado, por maior que
/// seja a janela. Sem isso, uma janela larga o bastante para caber 6 botões
/// no teto de largura ainda teria espaço para uma sétima coluna.
const int _maxColumns = 6;

/// Grade de botões de produto, filtrada pela categoria selecionada e pela
/// busca da barra de ferramentas.
///
/// Tocar um produto lança 1 unidade dele na venda (`counterCartProvider`) —
/// de novo no mesmo produto soma na linha existente, não duplica.
///
/// As linhas têm altura própria, não uma altura fixa para todas: um nome que
/// ocupa duas linhas ("Suco de Laranja 1/2 Jarra") faz a fila inteira crescer,
/// enquanto as filas de nomes curtos continuam baixas. Uma altura única para
/// todas ou cortaria os nomes longos ou desperdiçaria espaço em todas as
/// outras — e espaço aqui é produto que deixa de caber sem rolar.
///
/// **No máximo 6 produtos por fila** (`_maxColumns`), com **largura
/// dinâmica**: o botão divide o espaço disponível entre as colunas da fila
/// (dentro do intervalo `_minButtonWidth`–`_maxButtonWidth`), então o mesmo
/// valor vale para toda a grade — cheia a fila ou não. Uma fila com sobra (a
/// última de uma busca, ou uma categoria pequena) não estica os botões que
/// tem para preencher os 100%: eles ficam do mesmo tamanho dos de cima, e o
/// resto da fila fica em branco.
///
/// Fundo próprio (`PdvCounterColors.background`), separado da área acima
/// (categorias/lista/totais, que usam tons mais claros) por uma borda
/// superior — sem ela as duas se fundiriam onde a grade encosta na coluna de
/// categorias.
class CounterProductGrid extends ConsumerWidget {
  const CounterProductGrid({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final CatalogState catalog = ref.watch(catalogProvider);
    final String? selectedCategory = ref.watch(counterCategoryProvider);
    final String query = ref.watch(counterSearchProvider).trim().toLowerCase();

    if (!catalog.hydrated) {
      return const DecoratedBox(
        decoration: BoxDecoration(
          color: PdvCounterColors.background,
          border: Border(
            top: BorderSide(
              color: PdvCounterColors.border,
              width: PdvSizes.borderWidth,
            ),
          ),
        ),
        child: PdvLoadingState(message: 'Carregando catálogo…'),
      );
    }

    List<CounterProduct> products =
        selectedCategory == null
            ? catalog.products
            : catalog.products
                .where(
                  (CounterProduct product) =>
                      product.categoryId == selectedCategory,
                )
                .toList();

    if (query.isNotEmpty) {
      products =
          products
              .where(
                (CounterProduct product) =>
                    product.name.toLowerCase().contains(query),
              )
              .toList();
    }

    return DecoratedBox(
      decoration: const BoxDecoration(
        color: PdvCounterColors.background,
        border: Border(
          top: BorderSide(
            color: PdvCounterColors.border,
            width: PdvSizes.borderWidth,
          ),
        ),
      ),
      child:
          products.isEmpty
              ? _EmptyProducts(
                catalogEmpty: catalog.products.isEmpty && query.isEmpty,
              )
              : LayoutBuilder(
                builder: (BuildContext context, BoxConstraints constraints) {
                  // A fila mora dentro do `ListView` de baixo, que tem
                  // `EdgeInsets.all(_gap)` de padding — a largura que ela
                  // realmente recebe é `constraints.maxWidth` menos os dois
                  // lados desse padding, não a largura cheia daqui. Usar a
                  // largura cheia sobra 12 px (2×`_gap`) de botão que a fila
                  // não tem onde pôr: veio a estourar em `RenderFlex
                  // overflowed`.
                  final double rowWidth = constraints.maxWidth - (_gap * 2);
                  final int columns = _columnsFor(rowWidth);
                  final double buttonWidth = _buttonWidthFor(rowWidth, columns);
                  final List<List<CounterProduct>> rows = _chunk(
                    products,
                    columns,
                  );

                  return ListView.separated(
                    padding: const EdgeInsets.all(_gap),
                    itemCount: rows.length,
                    separatorBuilder:
                        (BuildContext context, int index) =>
                            const SizedBox(height: _gap),
                    itemBuilder:
                        (BuildContext context, int index) => _ProductRow(
                          products: rows[index],
                          buttonWidth: buttonWidth,
                        ),
                  );
                },
              ),
    );
  }

  /// Colunas que cabem em [width] sem nenhuma ficar mais estreita que
  /// [_minButtonWidth] — busca de trás para a frente, do teto (6) até 1,
  /// porque é o maior número de colunas que ainda respeita o piso que
  /// interessa.
  static int _columnsFor(double width) {
    for (int columns = _maxColumns; columns > 1; columns--) {
      final double raw = (width - (columns - 1) * _gap) / columns;
      if (raw >= _minButtonWidth) {
        return columns;
      }
    }
    return 1;
  }

  /// Largura do botão para [columns] colunas em [width], sem passar de
  /// [_maxButtonWidth] — é o teto que evita o botão esticar até preencher a
  /// fila numa janela larga.
  static double _buttonWidthFor(double width, int columns) {
    final double raw = (width - (columns - 1) * _gap) / columns;
    return raw.clamp(_minButtonWidth, _maxButtonWidth);
  }

  static List<List<CounterProduct>> _chunk(
    List<CounterProduct> items,
    int size,
  ) {
    return <List<CounterProduct>>[
      for (int i = 0; i < items.length; i += size)
        items.sublist(i, i + size > items.length ? items.length : i + size),
    ];
  }
}

/// Uma fila da grade.
///
/// Cada produto vira um `SizedBox` de largura fixa — a mesma [buttonWidth]
/// para toda a grade, calculada uma vez em `CounterProductGrid` a partir da
/// largura disponível. Sem `Expanded`: uma fila com menos produtos que o teto
/// de colunas não estica os que tem para preencher o resto; a fila termina
/// mais cedo e o resto fica em branco, à esquerda alinhado com as de cima.
///
/// O `IntrinsicHeight` é o que faz os botões da fila terminarem todos na mesma
/// linha de base mesmo quando um deles tem nome de duas linhas. Custa uma
/// passada extra de medição, aceitável porque só as filas visíveis são
/// construídas — o `ListView` acima cuida disso.
class _ProductRow extends ConsumerWidget {
  const _ProductRow({required this.products, required this.buttonWidth});

  final List<CounterProduct> products;
  final double buttonWidth;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          for (int i = 0; i < products.length; i++) ...<Widget>[
            if (i > 0) const SizedBox(width: _gap),
            SizedBox(
              width: buttonWidth,
              child: _ProductButton(
                product: products[i],
                onPressed: () {
                  launchProductToCart(
                    context: context,
                    ref: ref,
                    product: products[i],
                  );
                },
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// Categoria/busca sem nenhum produto correspondente — ou catálogo vazio.
class _EmptyProducts extends StatelessWidget {
  const _EmptyProducts({required this.catalogEmpty});

  final bool catalogEmpty;

  @override
  Widget build(BuildContext context) {
    if (catalogEmpty) {
      return const PdvEmptyState(
        title: 'Nenhum produto nesta unidade',
        subtitle: 'Sem rede e sem cache, a grade fica vazia até sincronizar.',
        icon: Icons.inventory_2_outlined,
      );
    }
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          const Icon(
            Icons.search_off,
            size: PdvSizes.iconLg,
            color: PdvCounterColors.foregroundMuted,
          ),
          const SizedBox(height: PdvSpacing.sm),
          Text(
            'Nenhum produto encontrado',
            style: PdvTypography.bodyLg.copyWith(
              color: PdvCounterColors.foregroundMuted,
            ),
          ),
        ],
      ),
    );
  }
}

class _ProductButton extends StatelessWidget {
  const _ProductButton({required this.product, required this.onPressed});

  final CounterProduct product;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final bool outOfStock = product.isOutOfStock;
    // A sombra vai no `DecoratedBox` por fora, não no `Material`: o `Material`
    // aqui não tem `elevation` (a interface é toda plana, cantos vivos — ver
    // AGENTS.md 4.0), então a profundidade do botão vem só daqui. Por fora e
    // não dentro, porque `BoxShadow` pinta além dos limites da própria caixa
    // — dentro do `Material` ela seria cortada pelo próprio botão.
    return DecoratedBox(
      decoration: BoxDecoration(
        color:
            outOfStock
                ? PdvCounterColors.surfaceStrong.withValues(alpha: 0.55)
                : PdvCounterColors.surfaceStrong,
        boxShadow: PdvCounterColors.productShadow,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onPressed,
          hoverColor: PdvCounterColors.surfaceHover,
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: PdvSpacing.sm,
              vertical: PdvSpacing.md,
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                Text(
                  product.name,
                  style: PdvTypography.labelSm.copyWith(
                    color: PdvCounterColors.foreground,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: PdvSpacing.xxs),
                Text(
                  formatCents(product.priceCents),
                  style: PdvTypography.labelSm.copyWith(
                    color: PdvCounterColors.foreground,
                    fontFeatures: PdvTypography.tabular,
                  ),
                  textAlign: TextAlign.center,
                ),
                if (outOfStock) ...<Widget>[
                  const SizedBox(height: PdvSpacing.xxs),
                  Text(
                    'Sem estoque',
                    style: PdvTypography.labelSm.copyWith(
                      color: PdvCounterColors.danger,
                      fontSize: 11,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
