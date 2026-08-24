import 'dart:async';

import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/delivery/domain/delivery_order.dart';
import 'package:citybox_pdv/features/tables/application/salon_controller.dart';
import 'package:citybox_pdv/features/tables/data/shared_preferences_salon_store.dart';
import 'package:citybox_pdv/features/tables/domain/salon_account.dart';
import 'package:citybox_pdv/features/tables/domain/salon_enums.dart';

/// Modo de exibição dos pedidos, escolhido em **Configurações dos pedidos**.
enum DeliveryViewMode { table, cards, kanban }

extension DeliveryViewModeLabel on DeliveryViewMode {
  String get label => switch (this) {
    DeliveryViewMode.table => 'Tabela',
    DeliveryViewMode.cards => 'Cartões',
    DeliveryViewMode.kanban => 'Kanban',
  };
}

/// Recorte por situação, como o operador pensa — não como o enum é gravado.
///
/// "Aberto" junta recebido, em preparo e a caminho: da perspectiva de quem
/// opera, os três são pedido que ainda dá trabalho.
enum DeliveryStatusFilter { open, closed, cancelled }

extension DeliveryStatusFilterLabel on DeliveryStatusFilter {
  String get label => switch (this) {
    DeliveryStatusFilter.open => 'Abertos',
    DeliveryStatusFilter.closed => 'Fechados',
    DeliveryStatusFilter.cancelled => 'Cancelados',
  };
}

/// Cor da situação de um pedido no quadro. Ver `PdvDeliveryColors` e o diálogo
/// de Legenda de cores.
enum DeliveryTone {
  awaitingConfirmation,
  open,
  awaitingPayment,
  paid,
  finished,
  cancelled,
}

extension DeliveryToneStyle on DeliveryTone {
  Color get color => switch (this) {
    DeliveryTone.awaitingConfirmation => PdvDeliveryColors.awaitingConfirmation,
    DeliveryTone.open => PdvDeliveryColors.open,
    DeliveryTone.awaitingPayment => PdvDeliveryColors.awaitingPayment,
    DeliveryTone.paid => PdvDeliveryColors.paid,
    DeliveryTone.finished => PdvDeliveryColors.finished,
    DeliveryTone.cancelled => PdvDeliveryColors.cancelled,
  };

  String get label => switch (this) {
    DeliveryTone.awaitingConfirmation => 'Aguardando Confirmação',
    DeliveryTone.open => 'Aberto',
    DeliveryTone.awaitingPayment => 'Aguardando Pagamento',
    DeliveryTone.paid => 'Pago',
    DeliveryTone.finished => 'Finalizado',
    DeliveryTone.cancelled => 'Cancelado',
  };
}

/// Situação visual do pedido, cruzando status operacional e pagamento.
///
/// Pagamento (SaleOrder) **não** move a coluna do Kanban. "Pago" sobrescreve
/// "Aguardando pagamento" enquanto o ciclo físico não chega em `delivered`.
DeliveryTone deliveryToneOf(DeliveryOrder order, SalonAccount? account) {
  if (order.status == DeliveryOrderStatus.cancelled) {
    return DeliveryTone.cancelled;
  }
  if (order.status == DeliveryOrderStatus.delivered) {
    return DeliveryTone.finished;
  }
  if (order.isPaid) {
    return DeliveryTone.paid;
  }
  if (account?.status == SalonAccountStatus.closing) {
    return DeliveryTone.awaitingPayment;
  }
  if (order.status == DeliveryOrderStatus.dispatched &&
      account != null &&
      account.isActive) {
    return DeliveryTone.awaitingPayment;
  }
  if (order.status == DeliveryOrderStatus.received) {
    return DeliveryTone.awaitingConfirmation;
  }
  return DeliveryTone.open;
}

/// Colunas do quadro, na ordem em que o pedido caminha.
///
/// `cancelled` **não** vira coluna: pedido cancelado não é uma etapa do
/// caminho, é uma saída dele. Quem quiser vê-los usa o filtro de situação.
const List<DeliveryOrderStatus> deliveryBoardColumns = <DeliveryOrderStatus>[
  DeliveryOrderStatus.received,
  DeliveryOrderStatus.preparing,
  DeliveryOrderStatus.dispatched,
  DeliveryOrderStatus.delivered,
];

class DeliveryOrdersQuery {
  const DeliveryOrdersQuery({
    this.search = '',
    this.fulfillments = const <DeliveryFulfillment>{},
    this.statuses = const <DeliveryStatusFilter>{DeliveryStatusFilter.open},
    this.page = 1,
    this.perPage = 36,
  });

  final String search;

  /// Conjunto **vazio = sem recorte** (mostra tudo). É diferente de marcar as
  /// duas opções, que dá no mesmo resultado mas por escolha explícita.
  final Set<DeliveryFulfillment> fulfillments;
  final Set<DeliveryStatusFilter> statuses;

  /// Paginação — só o modo Tabela usa. Quadro e cartões mostram tudo: separar
  /// o quadro em páginas esconderia pedido em andamento atrás de um "próximo".
  final int page;
  final int perPage;

  bool get hasActiveFilter =>
      fulfillments.isNotEmpty ||
      !(statuses.length == 1 &&
          statuses.contains(DeliveryStatusFilter.open));

  DeliveryOrdersQuery copyWith({
    String? search,
    Set<DeliveryFulfillment>? fulfillments,
    Set<DeliveryStatusFilter>? statuses,
    int? page,
    int? perPage,
  }) {
    return DeliveryOrdersQuery(
      search: search ?? this.search,
      fulfillments: fulfillments ?? this.fulfillments,
      statuses: statuses ?? this.statuses,
      page: page ?? this.page,
      perPage: perPage ?? this.perPage,
    );
  }
}

bool _matchesStatus(DeliveryOrder order, Set<DeliveryStatusFilter> filters) {
  if (filters.isEmpty) return true;
  return filters.any(
    (DeliveryStatusFilter f) => switch (f) {
      DeliveryStatusFilter.open =>
        order.status == DeliveryOrderStatus.received ||
            order.status == DeliveryOrderStatus.preparing ||
            order.status == DeliveryOrderStatus.dispatched,
      DeliveryStatusFilter.closed =>
        order.status == DeliveryOrderStatus.delivered,
      DeliveryStatusFilter.cancelled =>
        order.status == DeliveryOrderStatus.cancelled,
    },
  );
}

bool _matchesSearch(DeliveryOrder order, String search) {
  final String q = search.trim().toLowerCase();
  if (q.isEmpty) return true;
  final String hay =
      '${order.id} ${order.customerName ?? ''} ${order.addressText} '
              '${order.courierName ?? ''}'
          .toLowerCase();
  return hay.contains(q);
}

/// Aplica busca e filtros (função pura).
List<DeliveryOrder> filterDeliveryOrders({
  required List<DeliveryOrder> orders,
  required DeliveryOrdersQuery query,
}) {
  final List<DeliveryOrder> filtered =
      orders.where((DeliveryOrder o) {
        if (!_matchesSearch(o, query.search)) return false;
        if (query.fulfillments.isNotEmpty &&
            !query.fulfillments.contains(o.fulfillment)) {
          return false;
        }
        return _matchesStatus(o, query.statuses);
      }).toList();

  filtered.sort(
    (DeliveryOrder a, DeliveryOrder b) => b.createdAt.compareTo(a.createdAt),
  );
  return filtered;
}

/// Agrupa por coluna do quadro. Cancelados ficam de fora — ver
/// [deliveryBoardColumns].
Map<DeliveryOrderStatus, List<DeliveryOrder>> groupDeliveryOrdersByColumn(
  List<DeliveryOrder> orders,
) {
  return <DeliveryOrderStatus, List<DeliveryOrder>>{
    for (final DeliveryOrderStatus column in deliveryBoardColumns)
      column: orders.where((DeliveryOrder o) => o.status == column).toList(),
  };
}

final NotifierProvider<DeliveryOrdersQueryController, DeliveryOrdersQuery>
deliveryOrdersQueryProvider =
    NotifierProvider<DeliveryOrdersQueryController, DeliveryOrdersQuery>(
      DeliveryOrdersQueryController.new,
    );

class DeliveryOrdersQueryController extends Notifier<DeliveryOrdersQuery> {
  @override
  DeliveryOrdersQuery build() => const DeliveryOrdersQuery();

  /// Mexer na busca ou nos filtros volta para a primeira página — manter a
  /// atual mostraria "nada encontrado" num resultado que tem itens.
  void setSearch(String search) =>
      state = state.copyWith(search: search, page: 1);

  void applyFilters({
    required Set<DeliveryFulfillment> fulfillments,
    required Set<DeliveryStatusFilter> statuses,
  }) {
    state = state.copyWith(
      fulfillments: fulfillments,
      statuses: statuses,
      page: 1,
    );
  }

  void setPerPage(int perPage) =>
      state = state.copyWith(perPage: perPage, page: 1);

  void nextPage() => state = state.copyWith(page: state.page + 1);

  void previousPage() =>
      state = state.copyWith(page: state.page > 1 ? state.page - 1 : 1);

  /// Limpa os filtros preservando a busca — volta ao padrão "Abertos".
  void clearFilters() =>
      state = DeliveryOrdersQuery(
        search: state.search,
        perPage: state.perPage,
        statuses: const <DeliveryStatusFilter>{DeliveryStatusFilter.open},
      );
}

/// Modo de exibição. Persistido em `pdv.delivery_view_mode.v1`.
final NotifierProvider<DeliveryViewModeController, DeliveryViewMode>
deliveryViewModeProvider =
    NotifierProvider<DeliveryViewModeController, DeliveryViewMode>(
      DeliveryViewModeController.new,
    );

class DeliveryViewModeController extends Notifier<DeliveryViewMode> {
  static const String storageKey = 'pdv.delivery_view_mode.v1';

  SharedPreferences? _prefs;

  @override
  DeliveryViewMode build() {
    unawaited(_hydrate());
    return DeliveryViewMode.kanban;
  }

  Future<void> _hydrate() async {
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    _prefs = prefs;
    final String? raw = prefs.getString(storageKey);
    if (raw == null) {
      return;
    }
    for (final DeliveryViewMode mode in DeliveryViewMode.values) {
      if (mode.name == raw) {
        state = mode;
        return;
      }
    }
  }

  Future<void> set(DeliveryViewMode mode) async {
    state = mode;
    final SharedPreferences prefs =
        _prefs ?? await SharedPreferences.getInstance();
    _prefs = prefs;
    await prefs.setString(storageKey, mode.name);
  }
}

/// Uma página de pedidos para o modo Tabela.
class DeliveryOrdersPageResult {
  const DeliveryOrdersPageResult({
    required this.data,
    required this.total,
    required this.page,
    required this.perPage,
  });

  final List<DeliveryOrder> data;
  final int total;
  final int page;
  final int perPage;

  int get totalPages => total == 0 ? 0 : ((total + perPage - 1) ~/ perPage);
  bool get hasPrevious => page > 1;
  bool get hasNext => page < totalPages;
}

/// Recorta a página pedida (função pura).
///
/// A página é fixada dentro do intervalo válido: apagar um caractere da busca
/// pode encolher o resultado e deixar a página atual além do fim — sem isto a
/// tabela ficaria vazia com dados.
DeliveryOrdersPageResult paginateDeliveryOrders({
  required List<DeliveryOrder> orders,
  required DeliveryOrdersQuery query,
}) {
  final int perPage = query.perPage < 1 ? 36 : query.perPage;
  final int totalPages =
      orders.isEmpty ? 0 : ((orders.length + perPage - 1) ~/ perPage);
  int page = query.page < 1 ? 1 : query.page;
  if (totalPages > 0 && page > totalPages) page = totalPages;

  final int start = (page - 1) * perPage;
  final List<DeliveryOrder> slice =
      start >= orders.length
          ? const <DeliveryOrder>[]
          : orders.sublist(
            start,
            start + perPage > orders.length ? orders.length : start + perPage,
          );

  return DeliveryOrdersPageResult(
    data: slice,
    total: orders.length,
    page: page,
    perPage: perPage,
  );
}

/// Pedidos já filtrados, prontos para a tela.
final Provider<List<DeliveryOrder>> filteredDeliveryOrdersProvider =
    Provider<List<DeliveryOrder>>((Ref ref) {
      final SalonSnapshot snap = ref.watch(salonProvider);
      final DeliveryOrdersQuery query = ref.watch(deliveryOrdersQueryProvider);
      return filterDeliveryOrders(orders: snap.deliveryOrders, query: query);
    });

/// Página atual do modo Tabela.
final Provider<DeliveryOrdersPageResult> deliveryOrdersPageProvider =
    Provider<DeliveryOrdersPageResult>((Ref ref) {
      return paginateDeliveryOrders(
        orders: ref.watch(filteredDeliveryOrdersProvider),
        query: ref.watch(deliveryOrdersQueryProvider),
      );
    });
