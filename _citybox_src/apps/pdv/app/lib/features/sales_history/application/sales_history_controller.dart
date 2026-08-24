import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/features/cash/application/cash_shift_controller.dart';
import 'package:citybox_pdv/features/cash/domain/cash_enums.dart';
import 'package:citybox_pdv/features/cash/domain/cash_shift.dart';
import 'package:citybox_pdv/features/cash/domain/sale_record.dart';

/// Recorte por situação da venda — o único filtro que o domínio comporta hoje.
enum SalesHistoryStatusFilter { all, completed, cancelled }

extension SalesHistoryStatusFilterLabel on SalesHistoryStatusFilter {
  String get label => switch (this) {
    SalesHistoryStatusFilter.all => 'Todas',
    SalesHistoryStatusFilter.completed => 'Concluídas',
    SalesHistoryStatusFilter.cancelled => 'Canceladas',
  };
}

/// Filtro/paginação das vendas do turno aberto (application, não UI).
class SalesHistoryQuery {
  const SalesHistoryQuery({
    this.search = '',
    this.status = SalesHistoryStatusFilter.all,
    this.from,
    this.to,
    this.page = 1,
    this.perPage = 20,
  });

  final String search;
  final SalesHistoryStatusFilter status;

  /// Início do período, **inclusivo**. `null` = sem limite à esquerda.
  final DateTime? from;

  /// Fim do período. Comparado pelo **dia**, não pelo instante: quem escolhe
  /// "até 05/08" espera ver a venda das 20h daquele dia, não perdê-la porque o
  /// seletor devolveu 00:00.
  final DateTime? to;

  final int page;
  final int perPage;

  /// A busca não conta como filtro — ela tem campo próprio na barra. Isto é o
  /// que acende o indicador no botão "Filtros".
  bool get hasActiveFilter =>
      status != SalesHistoryStatusFilter.all || from != null || to != null;

  SalesHistoryQuery copyWith({
    String? search,
    SalesHistoryStatusFilter? status,
    DateTime? from,
    DateTime? to,
    bool clearFrom = false,
    bool clearTo = false,
    int? page,
    int? perPage,
  }) {
    return SalesHistoryQuery(
      search: search ?? this.search,
      status: status ?? this.status,
      from: clearFrom ? null : (from ?? this.from),
      to: clearTo ? null : (to ?? this.to),
      page: page ?? this.page,
      perPage: perPage ?? this.perPage,
    );
  }
}

/// Fim do dia de [day] — o instante depois do qual nada mais pertence a ele.
DateTime endOfDay(DateTime day) =>
    DateTime(day.year, day.month, day.day, 23, 59, 59, 999);

/// Começo do dia de [day].
DateTime startOfDay(DateTime day) => DateTime(day.year, day.month, day.day);

class SalesHistoryPageResult {
  const SalesHistoryPageResult({
    required this.data,
    required this.total,
    required this.page,
    required this.perPage,
  });

  final List<SaleRecord> data;
  final int total;
  final int page;
  final int perPage;

  int get totalPages => total == 0 ? 0 : ((total + perPage - 1) ~/ perPage);

  bool get hasPrevious => page > 1;
  bool get hasNext => page < totalPages;
}

SalesHistoryPageResult filterSalesHistory({
  required List<SaleRecord> sales,
  required SalesHistoryQuery query,
}) {
  final String q = query.search.trim().toLowerCase();
  final List<SaleRecord> filtered =
      sales.where((SaleRecord s) {
        if (!_matchesStatus(s, query.status)) return false;
        if (!_matchesPeriod(s, query)) return false;
        if (q.isEmpty) return true;
        // Busca sobre o que a tabela mostra — inclusive número e cliente, que
        // são as duas colunas pelas quais o operador procura de verdade.
        final String hay =
            '${s.id} ${s.number} ${s.customerName ?? ''} '
                    '${s.sellerName ?? ''} ${s.note ?? ''} ${s.totalCents}'
                .toLowerCase();
        return hay.contains(q);
      }).toList();

  filtered.sort(
    (SaleRecord a, SaleRecord b) => b.createdAt.compareTo(a.createdAt),
  );

  final int perPage = query.perPage < 1 ? 20 : query.perPage;
  final int totalPages =
      filtered.isEmpty ? 0 : ((filtered.length + perPage - 1) ~/ perPage);
  // A página é fixada dentro do intervalo válido em vez de devolver lista
  // vazia: apagar um caractere da busca pode encolher o resultado e deixar a
  // página atual além do fim — sem isto a tela ficaria vazia com dados.
  int page = query.page < 1 ? 1 : query.page;
  if (totalPages > 0 && page > totalPages) page = totalPages;

  final int start = (page - 1) * perPage;
  final List<SaleRecord> slice =
      start >= filtered.length
          ? const <SaleRecord>[]
          : filtered.sublist(
            start,
            start + perPage > filtered.length
                ? filtered.length
                : start + perPage,
          );

  return SalesHistoryPageResult(
    data: slice,
    total: filtered.length,
    page: page,
    perPage: perPage,
  );
}

bool _matchesPeriod(SaleRecord sale, SalesHistoryQuery query) {
  final DateTime at = sale.createdAt;
  final DateTime? from = query.from;
  final DateTime? to = query.to;
  if (from != null && at.isBefore(startOfDay(from))) return false;
  if (to != null && at.isAfter(endOfDay(to))) return false;
  return true;
}

bool _matchesStatus(SaleRecord sale, SalesHistoryStatusFilter filter) {
  return switch (filter) {
    SalesHistoryStatusFilter.all => true,
    SalesHistoryStatusFilter.completed =>
      sale.status == SaleRecordStatus.completed,
    SalesHistoryStatusFilter.cancelled =>
      sale.status == SaleRecordStatus.cancelled,
  };
}

/// Estado de busca/filtro/página da tela. Fica no application e não na página
/// para o recorte sobreviver a ir ao detalhe da venda e voltar.
final NotifierProvider<SalesHistoryQueryController, SalesHistoryQuery>
salesHistoryQueryProvider =
    NotifierProvider<SalesHistoryQueryController, SalesHistoryQuery>(
      SalesHistoryQueryController.new,
    );

class SalesHistoryQueryController extends Notifier<SalesHistoryQuery> {
  @override
  SalesHistoryQuery build() => const SalesHistoryQuery();

  /// Trocar busca ou filtro volta para a primeira página — manter a página
  /// atual mostraria "nada encontrado" num resultado que tem itens.
  void setSearch(String search) =>
      state = state.copyWith(search: search, page: 1);

  void setStatus(SalesHistoryStatusFilter status) =>
      state = state.copyWith(status: status, page: 1);

  /// Aplica período e situação de uma vez — é o que o botão **Aplicar** do
  /// painel faz. Passar `null` limpa a ponta correspondente.
  void applyFilters({
    required SalesHistoryStatusFilter status,
    required DateTime? from,
    required DateTime? to,
  }) {
    state = state.copyWith(
      status: status,
      from: from,
      to: to,
      clearFrom: from == null,
      clearTo: to == null,
      page: 1,
    );
  }

  /// Limpa período e situação, preservando a busca — ela é do campo da barra,
  /// não do painel de filtros.
  void clearFilters() {
    state = SalesHistoryQuery(search: state.search, perPage: state.perPage);
  }

  /// Trocar o tamanho da página volta para a primeira: manter a página atual
  /// com um `perPage` maior pode cair além do fim do resultado.
  void setPerPage(int perPage) =>
      state = state.copyWith(perPage: perPage, page: 1);

  void nextPage() => state = state.copyWith(page: state.page + 1);

  void previousPage() =>
      state = state.copyWith(page: state.page > 1 ? state.page - 1 : 1);

  void reset() => state = const SalesHistoryQuery();
}

final Provider<SalesHistoryPageResult> salesHistoryProvider =
    Provider<SalesHistoryPageResult>((Ref ref) {
      final CashShift? shift = ref.watch(cashShiftProvider);
      final SalesHistoryQuery query = ref.watch(salesHistoryQueryProvider);
      final List<SaleRecord> sales =
          shift == null || !shift.isOpen
              ? const <SaleRecord>[]
              : shift.sales
                  .where(
                    (SaleRecord s) =>
                        s.status == SaleRecordStatus.completed ||
                        s.status == SaleRecordStatus.cancelled,
                  )
                  .toList();
      return filterSalesHistory(sales: sales, query: query);
    });
