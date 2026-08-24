import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/app/shell/pdv_scaffold.dart';
import 'package:citybox_pdv/core/layout/pdv_breakpoints.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/counter/presentation/widgets/counter_app_bar.dart';
import 'package:citybox_pdv/features/counter/presentation/widgets/counter_cart_table.dart';
import 'package:citybox_pdv/features/counter/presentation/widgets/counter_category_sidebar.dart';
import 'package:citybox_pdv/features/counter/presentation/widgets/counter_product_grid.dart';
import 'package:citybox_pdv/features/counter/presentation/widgets/counter_toolbar.dart';
import 'package:citybox_pdv/features/counter/presentation/widgets/counter_totals_panel.dart';
import 'package:citybox_pdv/features/tables/application/active_account_sync.dart';

/// Tela de Balcão — o fluxo de venda no caixa.
class CounterPage extends StatelessWidget {
  const CounterPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const PdvScaffold(
      appBar: CounterAppBar(),
      contentPadding: EdgeInsets.zero,
      body: ActiveAccountBinder(child: _CounterContent()),
    );
  }
}

class _ContentTopEdge extends StatelessWidget {
  const _ContentTopEdge();

  @override
  Widget build(BuildContext context) {
    return const SizedBox(
      width: double.infinity,
      height: PdvSizes.borderWidthFocus,
      child: ColoredBox(color: PdvCounterColors.topEdge),
    );
  }
}

class _CounterContent extends StatelessWidget {
  const _CounterContent();

  static const double _sidebarWidth = 250;
  static const double _totalsWidth = 400;
  static const double _maxProductGridHeight = 320;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: PdvCounterColors.background,
      child: Column(
        children: <Widget>[
          const CounterToolbar(),
          const _ContentTopEdge(),
          Expanded(
            child: LayoutBuilder(
              builder: (BuildContext context, BoxConstraints constraints) {
                final PdvFormat format = PdvLayout.ofWidth(
                  constraints.maxWidth,
                );
                if (format.isCompact) {
                  return _compactBody();
                }
                if (format.isMedium) {
                  return _mediumBody();
                }
                return _expandedBody();
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _expandedBody() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        const SizedBox(width: _sidebarWidth, child: CounterCategorySidebar()),
        Expanded(
          child: Column(
            children: <Widget>[
              Expanded(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: const <Widget>[
                    Expanded(child: CounterCartTable()),
                    SizedBox(width: _totalsWidth, child: CounterTotalsPanel()),
                  ],
                ),
              ),
              ConstrainedBox(
                constraints: const BoxConstraints(
                  maxHeight: _maxProductGridHeight,
                ),
                child: const CounterProductGrid(),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _mediumBody() {
    // Médio: totais sob a lista (não ao lado) — a tabela de carrinho precisa
    // de largura; 280 px de painel lateral estouravam as colunas de dinheiro.
    return Column(
      children: <Widget>[
        Expanded(
          flex: 3,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: const <Widget>[
              SizedBox(width: 160, child: CounterCategorySidebar()),
              Expanded(child: CounterCartTable()),
            ],
          ),
        ),
        const SizedBox(height: 220, child: CounterTotalsPanel()),
        const Expanded(flex: 2, child: CounterProductGrid()),
      ],
    );
  }

  Widget _compactBody() {
    // Column (não ListView): mantém cart/totais/grade na árvore — ListView
    // lazy omitia a grade nos testes e em viewports curtos.
    return const Column(
      children: <Widget>[
        Expanded(flex: 2, child: CounterCartTable()),
        Expanded(flex: 2, child: CounterTotalsPanel()),
        Expanded(flex: 3, child: CounterProductGrid()),
      ],
    );
  }
}

/// Helper de navegação usado pela app bar.
void goCounterHome(BuildContext context) {
  if (context.canPop()) {
    context.pop();
  } else {
    context.go(PdvRoutes.home);
  }
}
