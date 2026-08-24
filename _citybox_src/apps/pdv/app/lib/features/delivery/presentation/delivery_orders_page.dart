import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/app/shell/pdv_back.dart';
import 'package:citybox_pdv/app/shell/pdv_scaffold.dart';
import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/delivery/application/delivery_orders_controller.dart';
import 'package:citybox_pdv/features/delivery/domain/delivery_order.dart';
import 'package:citybox_pdv/features/delivery/presentation/widgets/delivery_filters_sheet.dart';
import 'package:citybox_pdv/features/delivery/presentation/widgets/delivery_kanban_board.dart';
import 'package:citybox_pdv/features/delivery/presentation/widgets/delivery_legend_dialog.dart';
import 'package:citybox_pdv/features/delivery/presentation/widgets/delivery_order_card.dart';
import 'package:citybox_pdv/features/delivery/presentation/widgets/delivery_order_detail_sheet.dart';
import 'package:citybox_pdv/features/delivery/presentation/widgets/delivery_orders_table.dart';
import 'package:citybox_pdv/features/delivery/presentation/widgets/delivery_settings_dialog.dart';
import 'package:citybox_pdv/features/settings/application/terminal_settings_controller.dart';
import 'package:citybox_pdv/features/tables/application/active_account_sync.dart';
import 'package:citybox_pdv/features/tables/application/salon_controller.dart';
import 'package:citybox_pdv/features/tables/domain/salon_account.dart';
import 'package:citybox_pdv/features/tables/domain/salon_enums.dart';
import 'package:citybox_pdv/ui/pdv_app_bar_button.dart';
import 'package:citybox_pdv/app/shell/pdv_app_bar_chrome.dart';
import 'package:citybox_pdv/ui/pdv_empty_state.dart';
import 'package:citybox_pdv/ui/pdv_table.dart';
import 'package:citybox_pdv/ui/pdv_table_footer.dart';

/// Pedidos de delivery: quadro por etapa, com busca, filtros, legenda de
/// cores e escolha do modo de exibição.
class DeliveryOrdersPage extends ConsumerStatefulWidget {
  const DeliveryOrdersPage({super.key});

  @override
  ConsumerState<DeliveryOrdersPage> createState() => _DeliveryOrdersPageState();
}

class _DeliveryOrdersPageState extends ConsumerState<DeliveryOrdersPage> {
  late final TextEditingController _searchController;
  Timer? _pollTimer;
  bool _refreshing = false;

  static const Duration _pollInterval = Duration(seconds: 15);

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController(
      text: ref.read(deliveryOrdersQueryProvider).search,
    );
    WidgetsBinding.instance.addPostFrameCallback((_) => _silentRefresh());
    _pollTimer = Timer.periodic(_pollInterval, (_) => _silentRefresh());
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _goBack() => popOrHome(context);

  Future<void> _silentRefresh() async {
    try {
      await ref.read(salonProvider.notifier).refreshDeliveryOrders();
    } on Object {
      // Poll silencioso — não incomoda o operador.
    }
  }

  Future<void> _manualRefresh() async {
    if (_refreshing) return;
    setState(() => _refreshing = true);
    try {
      await ref.read(salonProvider.notifier).refreshDeliveryOrders();
    } on PdvApiException catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.message)));
    } on Object catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Não foi possível atualizar os pedidos.')),
      );
    } finally {
      if (mounted) setState(() => _refreshing = false);
    }
  }

  Future<void> _openOrder(DeliveryOrder order) async {
    final DeliveryOrderDetailAction? action = await showDeliveryOrderDetailSheet(
      context,
      order: order,
    );
    if (!mounted || action == null) {
      return;
    }
    final DeliveryOrder? latest = _latestOrder(order.id);
    final String? openAccountId = latest?.accountId ?? order.accountId;
    if (openAccountId == null) return;

    switch (action) {
      case DeliveryOrderDetailAction.openCounter:
        hydrateOpenSaleFromAccount(ref.read, openAccountId);
        context.go(
          '${PdvRoutes.counter}?accountId=$openAccountId'
          '&returnTo=${PdvRoutes.deliveryOrders}',
        );
      case DeliveryOrderDetailAction.pay:
        hydrateOpenSaleFromAccount(ref.read, openAccountId);
        await ref.read(salonProvider.notifier).beginClose(openAccountId);
        context.go(
          '${PdvRoutes.payment}?accountId=$openAccountId'
          '&returnTo=${PdvRoutes.deliveryOrders}',
        );
      case DeliveryOrderDetailAction.advanced:
      case DeliveryOrderDetailAction.cancelled:
        break;
    }
  }

  DeliveryOrder? _latestOrder(String id) {
    for (final DeliveryOrder order in ref.read(salonProvider).deliveryOrders) {
      if (order.id == id) return order;
    }
    return null;
  }

  Future<void> _advanceOrder(DeliveryOrder order) async {
    final DeliveryOrderStatus? next = switch (order.status) {
      DeliveryOrderStatus.received => DeliveryOrderStatus.preparing,
      DeliveryOrderStatus.preparing => DeliveryOrderStatus.dispatched,
      _ => null,
    };
    if (next == null) return;
    try {
      await ref
          .read(salonProvider.notifier)
          .updateDeliveryStatus(order.id, next);
    } on PdvApiException catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.message)));
    }
  }

  Future<void> _openFilters() async {
    final DeliveryFiltersResult? result = await showDeliveryFiltersSheet(
      context,
      query: ref.read(deliveryOrdersQueryProvider),
    );
    if (result == null) return;
    ref
        .read(deliveryOrdersQueryProvider.notifier)
        .applyFilters(
          fulfillments: result.fulfillments,
          statuses: result.statuses,
        );
  }

  Future<void> _openSettings() async {
    final DeliveryViewMode? picked = await showDeliverySettingsDialog(
      context,
      current: ref.read(deliveryViewModeProvider),
    );
    if (picked != null) {
      await ref.read(deliveryViewModeProvider.notifier).set(picked);
    }
  }

  @override
  Widget build(BuildContext context) {
    final DeliveryOrdersQuery query = ref.watch(deliveryOrdersQueryProvider);
    final DeliveryViewMode mode = ref.watch(deliveryViewModeProvider);
    final List<DeliveryOrder> orders = ref.watch(
      filteredDeliveryOrdersProvider,
    );
    final SalonController salon = ref.read(salonProvider.notifier);

    DeliveryTone toneOf(DeliveryOrder order) {
      final String? accountId = order.accountId;
      final SalonAccount? account =
          accountId == null ? null : salon.accountById(accountId);
      return deliveryToneOf(order, account);
    }

    return CallbackShortcuts(
      bindings: <ShortcutActivator, VoidCallback>{
        const SingleActivator(LogicalKeyboardKey.escape, shift: true): _goBack,
      },
      child: Focus(
        autofocus: true,
        child: PdvScaffold(
          contentPadding: EdgeInsets.zero,
          appBar: PdvAppBarChrome(
            child: Row(
              children: <Widget>[
                PdvAppBarButton(
                  icon: Icons.chevron_left,
                  label: 'Voltar',
                  secondaryLabel: '(Shift + Esc)',
                  tooltip: 'Voltar para a tela inicial (Shift + Esc)',
                  iconSize: PdvSizes.iconLg,
                  onPressed: _goBack,
                ),
                const _ToolbarSeparator(),
                Expanded(
                  child: _SearchField(
                    controller: _searchController,
                    onChanged:
                        (String value) => ref
                            .read(deliveryOrdersQueryProvider.notifier)
                            .setSearch(value),
                  ),
                ),
                const _ToolbarSeparator(),
                PdvAppBarButton(
                  icon: Icons.add,
                  label: 'Novo delivery',
                  tooltip: 'Criar novo pedido de delivery',
                  onPressed: () => context.push(PdvRoutes.deliveryNew),
                ),
                PdvAppBarButton(
                  icon: Icons.refresh,
                  label: _refreshing ? 'Atualizando…' : 'Atualizar',
                  tooltip: 'Atualizar pedidos do servidor',
                  onPressed: () {
                    if (!_refreshing) {
                      unawaited(_manualRefresh());
                    }
                  },
                ),
                PdvAppBarButton(
                  icon: Icons.filter_list,
                  label: query.hasActiveFilter ? 'Filtros ●' : 'Filtros',
                  tooltip: 'Filtrar por forma de entrega e situação',
                  onPressed: _openFilters,
                ),
                PdvAppBarButton(
                  icon: Icons.palette_outlined,
                  tooltip: 'Legenda de cores',
                  onPressed: () => showDeliveryLegendDialog(context),
                ),
                PdvAppBarButton(
                  icon: Icons.settings,
                  tooltip: 'Configurações dos pedidos',
                  onPressed: _openSettings,
                ),
              ],
            ),
          ),
          body: switch (mode) {
            // O quadro aparece **sempre**, mesmo sem nenhum pedido: as quatro
            // colunas são a própria estrutura do serviço, e trocá-las por um
            // estado vazio esconde do operador para onde os pedidos vão. Cada
            // coluna diz por si só que está zerada, pelo contador no topo.
            DeliveryViewMode.kanban => DeliveryKanbanBoard(
              columns: groupDeliveryOrdersByColumn(orders),
              toneOf: toneOf,
              onOpenOrder: _openOrder,
              onAdvanceOrder: _advanceOrder,
            ),
            // Cartões e tabela não têm estrutura para mostrar quando vazios —
            // uma tela em branco não diz nada, então aqui o vazio explica.
            DeliveryViewMode.cards =>
              orders.isEmpty
                  ? _EmptyOrders(query: query)
                  : _CardsView(
                    orders: orders,
                    toneOf: toneOf,
                    onOpenOrder: _openOrder,
                  ),
            // Tabela segue o desenho de Últimas vendas: cabeçalho fixo com
            // barra de carregamento, linhas zebradas e rodapé de paginação —
            // tudo de `lib/ui/pdv_table*.dart`, compartilhado entre as duas.
            DeliveryViewMode.table => _TableView(
              toneOf: toneOf,
              onOpenOrder: _openOrder,
            ),
          },
        ),
      ),
    );
  }
}

/// Vazio dos modos Cartões e Tabela. O texto muda conforme haja recorte
/// aplicado: "não existe pedido" e "não existe pedido *com este filtro*" são
/// problemas diferentes, e mandam o operador para lugares diferentes.
class _EmptyOrders extends StatelessWidget {
  const _EmptyOrders({required this.query});

  final DeliveryOrdersQuery query;

  @override
  Widget build(BuildContext context) {
    final bool narrowed = query.hasActiveFilter || query.search.isNotEmpty;
    return PdvEmptyState(
      title:
          narrowed
              ? 'Nenhum pedido para este recorte'
              : 'Nenhum pedido em aberto',
      subtitle:
          narrowed
              ? 'Ajuste a busca ou os filtros.'
              : 'Crie um delivery pelo botão Novo delivery.',
    );
  }
}

/// Grade de cartões — o quadro sem a separação por etapa.
class _CardsView extends StatelessWidget {
  const _CardsView({
    required this.orders,
    required this.toneOf,
    required this.onOpenOrder,
  });

  final List<DeliveryOrder> orders;
  final DeliveryTone Function(DeliveryOrder) toneOf;
  final void Function(DeliveryOrder) onOpenOrder;

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.all(PdvSpacing.md),
      gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
        maxCrossAxisExtent: 360,
        mainAxisSpacing: PdvSpacing.sm,
        crossAxisSpacing: PdvSpacing.sm,
        mainAxisExtent: 120,
      ),
      itemCount: orders.length,
      itemBuilder: (BuildContext context, int index) {
        final DeliveryOrder order = orders[index];
        return DeliveryOrderCard(
          order: order,
          tone: toneOf(order),
          onTap: () => onOpenOrder(order),
        );
      },
    );
  }
}

/// Tabela paginada — para varrer muitos pedidos de uma vez.
///
/// `ConsumerWidget` próprio em vez de receber a lista pronta: a página, o
/// tamanho dela e o estado de carregamento são assunto da tabela, e passar
/// tudo por parâmetro só engordaria a assinatura da tela.
class _TableView extends ConsumerWidget {
  const _TableView({required this.toneOf, required this.onOpenOrder});

  final DeliveryTone Function(DeliveryOrder) toneOf;
  final void Function(DeliveryOrder) onOpenOrder;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final DeliveryOrdersPageResult result = ref.watch(
      deliveryOrdersPageProvider,
    );
    final bool hydrated = ref.watch(salonHydratedProvider);
    final String terminalLabel =
        ref.watch(terminalSettingsProvider).terminalLabel;

    return Column(
      children: <Widget>[
        DeliveryOrdersTableHeader(isLoading: !hydrated),
        Expanded(
          child:
              result.data.isEmpty
                  ? const PdvTableEmpty(
                    message: 'Nenhum registro correspondente encontrado',
                  )
                  : ListView.builder(
                    itemCount: result.data.length,
                    itemBuilder: (BuildContext context, int index) {
                      final DeliveryOrder order = result.data[index];
                      return DeliveryOrdersRow(
                        order: order,
                        tone: toneOf(order),
                        terminalLabel: terminalLabel,
                        striped: index.isOdd,
                        onOpen: () => onOpenOrder(order),
                      );
                    },
                  ),
        ),
        PdvTableFooter(
          page: result.page,
          totalPages: result.totalPages,
          total: result.total,
          perPage: result.perPage,
          onPerPageChanged:
              (int value) => ref
                  .read(deliveryOrdersQueryProvider.notifier)
                  .setPerPage(value),
          onPrevious:
              result.hasPrevious
                  ? () =>
                      ref
                          .read(deliveryOrdersQueryProvider.notifier)
                          .previousPage()
                  : null,
          onNext:
              result.hasNext
                  ? () =>
                      ref.read(deliveryOrdersQueryProvider.notifier).nextPage()
                  : null,
        ),
      ],
    );
  }
}

/// Campo de busca embutido na barra — mesmo padrão de Últimas vendas: sem
/// moldura, porque a barra já é a caixa dele.
class _SearchField extends StatelessWidget {
  const _SearchField({required this.controller, required this.onChanged});

  final TextEditingController controller;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: <Widget>[
        Expanded(
          child: TextField(
            controller: controller,
            onChanged: onChanged,
            style: PdvTypography.bodyMd.copyWith(
              color: PdvAppBarColors.foreground,
            ),
            cursorColor: PdvColors.focusRing,
            decoration: InputDecoration(
              hintText: 'Buscar',
              hintStyle: PdvTypography.bodyMd.copyWith(
                color: PdvColors.textDisabled,
              ),
              filled: false,
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: PdvSpacing.lg,
              ),
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(right: PdvSpacing.md),
          child: Icon(
            Icons.search,
            size: PdvSizes.iconMd,
            color: PdvAppBarColors.foreground,
          ),
        ),
      ],
    );
  }
}

class _ToolbarSeparator extends StatelessWidget {
  const _ToolbarSeparator();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: PdvSizes.borderWidthFocus,
      height: PdvSizes.appBarHeight,
      color: PdvAppBarColors.separator,
    );
  }
}
