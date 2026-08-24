import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/features/cash/application/cash_shift_controller.dart';
import 'package:citybox_pdv/features/cash/domain/cash_enums.dart';
import 'package:citybox_pdv/features/cash/domain/sale_record.dart';
import 'package:citybox_pdv/features/sales_history/application/sales_history_controller.dart';

SaleRecord _sale({
  required String id,
  required DateTime createdAt,
  int number = 0,
  String? customerName,
  int totalCents = 1000,
  SaleRecordStatus status = SaleRecordStatus.completed,
}) {
  return SaleRecord(
    id: id,
    number: number,
    customerName: customerName,
    shiftId: 'shift-1',
    status: status,
    createdAt: createdAt,
    lines: const <SaleLineSnapshot>[],
    payments: const <SalePaymentSnapshot>[],
    subtotalCents: totalCents,
    totalCents: totalCents,
    cashReceivedCents: 0,
    changeCents: 0,
    cashNetCents: 0,
  );
}

void main() {
  group('nextSaleNumber', () {
    test('começa em 1 num turno sem vendas', () {
      expect(nextSaleNumber(const <SaleRecord>[]), 1);
    });

    test('usa o maior número já emitido, não a quantidade de vendas', () {
      // Venda 2 cancelada continua na lista ocupando o número dela: contar o
      // tamanho devolveria 3 depois de excluir uma, reemitindo um número.
      final List<SaleRecord> sales = <SaleRecord>[
        _sale(id: 'a', number: 1, createdAt: DateTime(2026, 8, 5, 10)),
        _sale(
          id: 'b',
          number: 2,
          createdAt: DateTime(2026, 8, 5, 11),
          status: SaleRecordStatus.cancelled,
        ),
        _sale(id: 'c', number: 3, createdAt: DateTime(2026, 8, 5, 12)),
      ];
      expect(nextSaleNumber(sales), 4);
    });

    test('resetAt faz a contagem recomeçar do 1', () {
      // Zerar numeração não reescreve venda gravada — só muda de onde a
      // contagem parte daqui para a frente.
      final List<SaleRecord> sales = <SaleRecord>[
        _sale(id: 'a', number: 7, createdAt: DateTime(2026, 8, 5, 10)),
        _sale(id: 'b', number: 8, createdAt: DateTime(2026, 8, 5, 11)),
      ];
      expect(nextSaleNumber(sales), 9);
      expect(nextSaleNumber(sales, resetAt: DateTime(2026, 8, 5, 12)), 1);
    });

    test('depois de zerar, continua contando a partir do reinício', () {
      final DateTime resetAt = DateTime(2026, 8, 5, 12);
      final List<SaleRecord> sales = <SaleRecord>[
        _sale(id: 'a', number: 7, createdAt: DateTime(2026, 8, 5, 10)),
        _sale(id: 'b', number: 1, createdAt: DateTime(2026, 8, 5, 13)),
      ];
      expect(nextSaleNumber(sales, resetAt: resetAt), 2);
    });

    test('ignora vendas antigas sem número', () {
      final List<SaleRecord> sales = <SaleRecord>[
        _sale(id: 'a', createdAt: DateTime(2026, 8, 5, 10)),
        _sale(id: 'b', createdAt: DateTime(2026, 8, 5, 11)),
      ];
      expect(nextSaleNumber(sales), 1);
    });
  });

  group('filterSalesHistory', () {
    final List<SaleRecord> sales = <SaleRecord>[
      _sale(
        id: 'aaa',
        number: 1,
        customerName: 'Maria Souza',
        createdAt: DateTime(2026, 8, 5, 10),
        totalCents: 1500,
      ),
      _sale(
        id: 'bbb',
        number: 2,
        createdAt: DateTime(2026, 8, 5, 11),
        totalCents: 2500,
        status: SaleRecordStatus.cancelled,
      ),
      _sale(
        id: 'ccc',
        number: 3,
        customerName: 'João Lima',
        createdAt: DateTime(2026, 8, 5, 12),
        totalCents: 3500,
      ),
    ];

    test('ordena da venda mais recente para a mais antiga', () {
      final SalesHistoryPageResult result = filterSalesHistory(
        sales: sales,
        query: const SalesHistoryQuery(),
      );
      expect(result.data.map((SaleRecord s) => s.id).toList(), <String>[
        'ccc',
        'bbb',
        'aaa',
      ]);
    });

    test('busca pelo nome do cliente', () {
      final SalesHistoryPageResult result = filterSalesHistory(
        sales: sales,
        query: const SalesHistoryQuery(search: 'maria'),
      );
      expect(result.total, 1);
      expect(result.data.single.id, 'aaa');
    });

    test('busca pelo número da venda', () {
      final SalesHistoryPageResult result = filterSalesHistory(
        sales: sales,
        query: const SalesHistoryQuery(search: '3'),
      );
      expect(result.data.single.id, 'ccc');
    });

    test('filtra por situação', () {
      final SalesHistoryPageResult result = filterSalesHistory(
        sales: sales,
        query: const SalesHistoryQuery(
          status: SalesHistoryStatusFilter.cancelled,
        ),
      );
      expect(result.total, 1);
      expect(result.data.single.id, 'bbb');
    });

    test('pagina e informa se há página anterior/próxima', () {
      final SalesHistoryPageResult first = filterSalesHistory(
        sales: sales,
        query: const SalesHistoryQuery(perPage: 2),
      );
      expect(first.data.length, 2);
      expect(first.totalPages, 2);
      expect(first.hasPrevious, isFalse);
      expect(first.hasNext, isTrue);

      final SalesHistoryPageResult second = filterSalesHistory(
        sales: sales,
        query: const SalesHistoryQuery(page: 2, perPage: 2),
      );
      expect(second.data.single.id, 'aaa');
      expect(second.hasPrevious, isTrue);
      expect(second.hasNext, isFalse);
    });

    test('fixa a página na última quando o filtro encolhe o resultado', () {
      // Estava na página 2 e o filtro deixou só uma página: sem o clamp a
      // tela mostraria "sem dados" existindo dado.
      final SalesHistoryPageResult result = filterSalesHistory(
        sales: sales,
        query: const SalesHistoryQuery(
          page: 2,
          perPage: 2,
          status: SalesHistoryStatusFilter.cancelled,
        ),
      );
      expect(result.page, 1);
      expect(result.data.single.id, 'bbb');
    });

    test('filtra pelo período, pelo dia e não pelo instante', () {
      // "Até 05/08" tem que incluir a venda das 12h daquele dia: o seletor
      // devolve 00:00, e comparar cru cortaria o dia inteiro.
      final SalesHistoryPageResult result = filterSalesHistory(
        sales: sales,
        query: SalesHistoryQuery(
          from: DateTime(2026, 8, 5),
          to: DateTime(2026, 8, 5),
        ),
      );
      expect(result.total, 3);
    });

    test('período recorta as vendas fora dele', () {
      final SalesHistoryPageResult result = filterSalesHistory(
        sales: sales,
        query: SalesHistoryQuery(from: DateTime(2026, 8, 6)),
      );
      expect(result.total, 0);
    });

    test('período e situação se combinam', () {
      final SalesHistoryPageResult result = filterSalesHistory(
        sales: sales,
        query: SalesHistoryQuery(
          from: DateTime(2026, 8, 5),
          to: DateTime(2026, 8, 5),
          status: SalesHistoryStatusFilter.cancelled,
        ),
      );
      expect(result.data.single.id, 'bbb');
    });

    test('hasActiveFilter ignora a busca e enxerga o período', () {
      expect(const SalesHistoryQuery(search: 'algo').hasActiveFilter, isFalse);
      expect(
        SalesHistoryQuery(from: DateTime(2026, 8, 5)).hasActiveFilter,
        isTrue,
      );
    });

    test('resultado vazio não tem páginas', () {
      final SalesHistoryPageResult result = filterSalesHistory(
        sales: sales,
        query: const SalesHistoryQuery(search: 'inexistente'),
      );
      expect(result.total, 0);
      expect(result.totalPages, 0);
      expect(result.hasNext, isFalse);
    });
  });

  group('SaleRecord', () {
    test('número e cliente sobrevivem ao round-trip de JSON', () {
      final SaleRecord original = _sale(
        id: 'aaa',
        number: 7,
        customerName: 'Maria Souza',
        createdAt: DateTime(2026, 8, 5, 10),
      );
      final SaleRecord restored = SaleRecord.fromJson(original.toJson());
      expect(restored.number, 7);
      expect(restored.customerName, 'Maria Souza');
    });

    test('turno gravado antes dos campos novos continua abrindo', () {
      final Map<String, dynamic> legacy =
          _sale(id: 'aaa', createdAt: DateTime(2026, 8, 5, 10)).toJson()
            ..remove('number')
            ..remove('customerName');

      final SaleRecord restored = SaleRecord.fromJson(legacy);
      expect(restored.number, 0);
      expect(restored.customerName, isNull);
    });
  });
}
