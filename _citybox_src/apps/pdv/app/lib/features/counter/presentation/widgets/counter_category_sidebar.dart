import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/catalog/application/catalog_controller.dart';
import 'package:citybox_pdv/features/counter/application/counter_category_controller.dart';
import 'package:citybox_pdv/features/counter/domain/counter_category.dart';

/// Coluna de categorias — filtra a grade de produtos.
///
/// "Todos os produtos" é o padrão e não vem do catálogo (ver
/// `counterCategoryProvider`); as demais entradas vêm de `catalogProvider`.
///
/// As categorias aparecem em maiúsculas e "Todos os produtos" não: a primeira
/// é texto do app, as outras são nome cadastrado pelo lojista, e a caixa alta
/// as marca como tal — é assim no PDV que serviu de referência.
///
/// A coluna tem fundo próprio (`categorySurface`), mais claro que o fundo
/// geral no tema escuro e mais próximo do branco no claro: é a única faixa da
/// tela que vai do topo ao rodapé, e sem cor própria ela se dissolveria na
/// grade de produtos ao lado.
class CounterCategorySidebar extends ConsumerWidget {
  const CounterCategorySidebar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final String? selected = ref.watch(counterCategoryProvider);
    final List<CounterCategory> categories =
        ref.watch(catalogProvider).categories;
    return ColoredBox(
      color: PdvCounterColors.categorySurface,
      child: ListView(
        padding: EdgeInsets.zero,
        children: <Widget>[
          _CategoryTile(
            label: 'Todos os produtos',
            selected: selected == null,
            onTap:
                () => ref.read(counterCategoryProvider.notifier).select(null),
          ),
          for (final CounterCategory category in categories)
            _CategoryTile(
              label: category.label.toUpperCase(),
              selected: selected == category.id,
              onTap:
                  () => ref
                      .read(counterCategoryProvider.notifier)
                      .select(category.id),
            ),
        ],
      ),
    );
  }
}

class _CategoryTile extends StatelessWidget {
  const _CategoryTile({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  /// Alta o bastante para ser tocada de primeira por quem está em pé e com
  /// pressa — o mesmo critério de `PdvSizes.controlHeight`.
  static const double _height = PdvSizes.controlHeight;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: PdvCounterColors.border)),
      ),
      child: Material(
        color: selected ? PdvCounterColors.accent : Colors.transparent,
        child: InkWell(
          onTap: onTap,
          hoverColor: PdvCounterColors.surfaceHover,
          child: SizedBox(
            height: _height,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: PdvSpacing.lg),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  label,
                  style: PdvTypography.labelSm.copyWith(
                    color:
                        selected
                            ? PdvColors.onBrand
                            : PdvCounterColors.accentMuted,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
