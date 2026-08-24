import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:go_router/go_router.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/core/feedback/not_implemented_feedback.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/counter/application/counter_customer_controller.dart';
import 'package:citybox_pdv/features/customer/domain/customer.dart';
import 'package:citybox_pdv/features/customer/presentation/pick_counter_customer.dart';
import 'package:citybox_pdv/features/home/data/home_actions.dart';
import 'package:citybox_pdv/features/home/domain/home_action.dart';
import 'package:citybox_pdv/features/home/domain/home_grid_layout.dart';
import 'package:citybox_pdv/features/home/presentation/widgets/home_action_bar.dart';
import 'package:citybox_pdv/features/home/presentation/widgets/home_action_tile.dart';
import 'package:citybox_pdv/features/modules/application/module_visibility_controller.dart';
import 'package:citybox_pdv/features/modules/domain/module_ids.dart';
import 'package:citybox_pdv/features/modules/domain/module_set_snapshot.dart';
import 'package:citybox_pdv/features/settings/application/terminal_settings_controller.dart';
import 'package:citybox_pdv/features/settings/domain/terminal_settings.dart';
import 'package:citybox_pdv/features/payment/application/sale_seller_controller.dart';
import 'package:citybox_pdv/features/payment/application/terminal_sellers_controller.dart';
import 'package:citybox_pdv/features/payment/domain/seller.dart';
import 'package:citybox_pdv/features/payment/presentation/widgets/seller_picker_dialog.dart';

/// Respiro entre os blocos — o único espaçamento da tela inicial.
///
/// Vale para a grade, para a coluna e para a separação entre as duas regiões.
/// Um número só, e não uma escala: a tela é uma malha de blocos coloridos
/// encostados, em que o espaço serve apenas para separar as cores, não para
/// criar hierarquia.
///
/// **Não há margem nas bordas.** Os blocos vão até o limite da área útil, como
/// num painel de operação — cada pixel de borda é área de toque perdida.
const double _gap = PdvSpacing.xs;

/// Executa uma ação da tela inicial.
///
/// Ponto único de entrada: o atalho de teclado e o toque chamam esta função, e
/// não cada um o seu caminho. Se divergirem, o teclado e o mouse passam a fazer
/// coisas diferentes — e o operador que aprendeu por um dos dois é quem paga.
///
/// Destinos reais: Balcão, Cliente, Caixa, Sangria, Últimas vendas,
/// Configurações, Vendedor. O restante ainda cai no aviso genérico.
void handleHomeAction(BuildContext context, WidgetRef ref, HomeAction action) {
  if (action.id == PdvModuleIds.counter) {
    context.push(PdvRoutes.counter);
    return;
  }

  if (action.id == PdvModuleIds.customer) {
    unawaited(pickCounterCustomer(context, ref));
    return;
  }

  if (action.id == PdvModuleIds.cashHub) {
    context.push(PdvRoutes.cash);
    return;
  }

  if (action.id == PdvModuleIds.cashDrawer) {
    context.push(PdvRoutes.cashMovement);
    return;
  }

  if (action.id == PdvModuleIds.history) {
    context.push(PdvRoutes.salesHistory);
    return;
  }

  if (action.id == PdvModuleIds.settings) {
    context.push(PdvRoutes.settings);
    return;
  }

  if (action.id == PdvModuleIds.seller) {
    unawaited(_pickSellerFromHome(context, ref));
    return;
  }

  if (action.id == PdvModuleIds.tables) {
    context.push(PdvRoutes.tables);
    return;
  }

  if (action.id == PdvModuleIds.tabs) {
    context.push(PdvRoutes.tabs);
    return;
  }

  if (action.id == PdvModuleIds.service) {
    context.push(PdvRoutes.service);
    return;
  }

  if (action.id == PdvModuleIds.deliveryOrders) {
    context.push(PdvRoutes.deliveryOrders);
    return;
  }

  if (action.id == PdvModuleIds.priceCheck) {
    context.push(PdvRoutes.priceCheck);
    return;
  }

  if (action.id == PdvModuleIds.refund) {
    context.push(PdvRoutes.refund);
    return;
  }

  if (action.id == PdvModuleIds.credit) {
    context.push(PdvRoutes.credit);
    return;
  }

  showNotImplementedFeedback(context, action.label);
}

Future<void> _pickSellerFromHome(BuildContext context, WidgetRef ref) async {
  final List<Seller> catalog =
      await ref.read(terminalSellersProvider.future);
  if (!context.mounted) return;
  final Seller? current = ref.read(saleSellerProvider);
  final SellerSelection? selection = await showSellerPickerDialog(
    context,
    sellers: catalog,
    selected: current,
  );
  if (selection == null) {
    return;
  }
  final Seller? picked = selection.seller;
  if (picked == null) {
    ref.read(saleSellerProvider.notifier).clear();
  } else {
    ref.read(saleSellerProvider.notifier).select(picked);
  }
}

/// Tela inicial do PDV.
///
/// Duas regiões, como todo PDV de balcão: a **grade** à esquerda, com as ações
/// que abrem uma venda, e a **coluna** à direita, com o apoio ao turno. Cada
/// ação tem cor fixa e tecla visível — o operador experiente não lê a tela,
/// ele digita.
///
/// O catálogo de ações vive em `home_actions.dart`. Esta tela só o desenha —
/// filtrando pelo que o painel de layout (dev) deixou visível.
class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Mantém o provider vivo e aplica o default (operador logado se vendedor).
    final Seller? saleSeller = ref.watch(saleSellerProvider);
    ref.watch(terminalSellersProvider);
    final Customer? counterCustomer = ref.watch(counterCustomerProvider);

    final ModuleSetSnapshot modules = ref.watch(moduleVisibilityProvider);
    final TerminalSettings settings = ref.watch(terminalSettingsProvider);
    final List<HomeAction> visible =
        homeActions
            .where(
              (HomeAction action) => modules.isOperationallyVisible(action.id),
            )
            .map((HomeAction action) {
              if (action.id == PdvModuleIds.seller) {
                return action.withSubtitle(
                  saleSeller?.name ?? 'Sem vendedor',
                );
              }
              if (action.id == PdvModuleIds.customer) {
                return action.withSubtitle(
                  CounterCustomerController.labelOf(counterCustomer),
                );
              }
              return action;
            })
            .toList();
    final HomeGridLayout grid = resolveHomeGrid(
      visible: visible,
      settings: settings,
    );
    final List<HomeAction> rail = resolveHomeRail(
      visible: visible,
      settings: settings,
      grid: grid,
    );

    // A ordem importa e não é intercambiável: `CallbackShortcuts` precisa
    // envolver o nó de foco, porque ele intercepta as teclas que sobem a partir
    // do widget focado. Com o `Focus` por fora, nada é interceptado e os
    // atalhos morrem em silêncio.
    //
    // O `autofocus` é o que faz o teclado funcionar assim que a tela abre. Num
    // caixa isso é requisito: o operador digita "B" logo depois de ler um
    // código de barras, sem passar pelo mouse.
    return CallbackShortcuts(
      bindings: <ShortcutActivator, VoidCallback>{
        // Um bloco escondido pelo painel de layout não responde ao próprio
        // atalho — senão o teclado dispara uma ação para algo que a tela nem
        // mostra.
        for (final HomeAction action in visible)
          SingleActivator(action.shortcut):
              () => handleHomeAction(context, ref, action),
      },
      child: Focus(
        autofocus: true,
        child: LayoutBuilder(
          builder: (BuildContext context, BoxConstraints constraints) {
            // Abaixo de ~900 px a coluna lateral espremeria a grade a ponto de
            // os blocos ficarem menores que o alvo confortável de toque. Nesse
            // caso a coluna vira uma faixa rolável abaixo da grade.
            final bool sideBySide = constraints.maxWidth >= 900;
            return sideBySide
                ? _WideLayout(grid: grid, rail: rail)
                : _NarrowLayout(grid: grid, rail: rail);
          },
        ),
      ),
    );
  }
}

class _WideLayout extends StatelessWidget {
  const _WideLayout({required this.grid, required this.rail});

  final HomeGridLayout grid;
  final List<HomeAction> rail;

  /// 30% para a coluna, 70% para a grade — em `flex`, não em pixel fixo, para
  /// a proporção se manter em qualquer tamanho de janela.
  static const int _railFlex = 3;
  static const int _gridFlex = 10 - _railFlex;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        Expanded(
          flex: _gridFlex,
          child: _ActionGrid(primary: grid.primary, secondary: grid.secondary),
        ),
        const SizedBox(width: _gap),
        Expanded(
          flex: _railFlex,
          child: _ActionRail(actions: rail, scrollable: false),
        ),
      ],
    );
  }
}

class _NarrowLayout extends StatelessWidget {
  const _NarrowLayout({required this.grid, required this.rail});

  final HomeGridLayout grid;
  final List<HomeAction> rail;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        Expanded(
          flex: 3,
          child: _ActionGrid(primary: grid.primary, secondary: grid.secondary),
        ),
        const SizedBox(height: _gap),
        Expanded(flex: 2, child: _ActionRail(actions: rail, scrollable: true)),
      ],
    );
  }
}

/// Grade de blocos grandes, dividida em duas sub-colunas de largura fixa.
///
/// **Coluna 1.1** (mais larga, `flex: _primaryFlex`): as ações principais do
/// caixa — Balcão, Mesas, Comandas (`HomeGridColumn.primary`). **Coluna 1.2**
/// (mais estreita, `flex: _secondaryFlex`): as demais
/// (`HomeGridColumn.secondary`).
///
/// Dentro de cada sub-coluna, os blocos visíveis dividem a altura igualmente
/// via `Expanded` — esconder um pelo painel de layout não deixa espaço em
/// branco: com um `Expanded` a menos disputando a mesma altura, os que restam
/// crescem sozinhos. Não precisa de lógica de prioridade nenhuma; é o próprio
/// mecanismo de flex do Flutter fazendo o trabalho.
///
/// Se uma sub-coluna inteira ficar vazia (todas as suas ações escondidas), a
/// outra assume a largura toda em vez de deixar metade da grade em branco.
class _ActionGrid extends StatelessWidget {
  const _ActionGrid({required this.primary, required this.secondary});

  final List<HomeAction> primary;
  final List<HomeAction> secondary;

  /// 3:2 — a coluna principal é 1,5× mais larga que a secundária.
  static const int _primaryFlex = 3;
  static const int _secondaryFlex = 2;

  @override
  Widget build(BuildContext context) {
    if (primary.isEmpty && secondary.isEmpty) {
      return const SizedBox.shrink();
    }
    if (secondary.isEmpty) {
      return _GridColumn(actions: primary);
    }
    if (primary.isEmpty) {
      return _GridColumn(actions: secondary);
    }

    return Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        Expanded(flex: _primaryFlex, child: _GridColumn(actions: primary)),
        const SizedBox(width: _gap),
        Expanded(flex: _secondaryFlex, child: _GridColumn(actions: secondary)),
      ],
    );
  }
}

/// Empilha os blocos de uma sub-coluna, dividindo a altura igualmente entre os
/// visíveis.
class _GridColumn extends ConsumerWidget {
  const _GridColumn({required this.actions});

  final List<HomeAction> actions;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (actions.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        for (int i = 0; i < actions.length; i++) ...<Widget>[
          if (i > 0) const SizedBox(height: _gap),
          Expanded(
            child: HomeActionTile(
              action: actions[i],
              onPressed: () => handleHomeAction(context, ref, actions[i]),
            ),
          ),
        ],
      ],
    );
  }
}

/// Coluna de ações de apoio.
class _ActionRail extends ConsumerWidget {
  const _ActionRail({required this.actions, required this.scrollable});

  final List<HomeAction> actions;

  /// Em tela estreita a coluna rola; em tela larga ela divide a altura
  /// disponível entre os itens, sem barra de rolagem.
  final bool scrollable;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (actions.isEmpty) {
      return const SizedBox.shrink();
    }

    final List<Widget> items = <Widget>[
      for (int i = 0; i < actions.length; i++) ...<Widget>[
        if (i > 0) const SizedBox(height: _gap),
        _railItem(context, ref, actions[i]),
      ],
    ];

    final Column column = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: items,
    );

    return scrollable ? SingleChildScrollView(child: column) : column;
  }

  Widget _railItem(BuildContext context, WidgetRef ref, HomeAction action) {
    final HomeActionBar bar = HomeActionBar(
      action: action,
      onPressed: () => handleHomeAction(context, ref, action),
    );

    // `Expanded` só é válido dentro de uma `Column` com altura definida; dentro
    // de um `SingleChildScrollView` a altura é infinita e ele explodiria.
    return scrollable ? bar : Expanded(child: bar);
  }
}
