import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/core/format/pdv_currency.dart';
import 'package:citybox_pdv/features/cash/application/cash_shift_controller.dart';
import 'package:citybox_pdv/features/cash/domain/cash_enums.dart';
import 'package:citybox_pdv/features/cash/domain/cash_shift.dart';
import 'package:citybox_pdv/features/cash/domain/sale_record.dart';
import 'package:citybox_pdv/features/sales_history/presentation/sales_history_page.dart';

import '../helpers/pump_with_router.dart';

SaleRecord _sampleSale(CashShift shift) {
  return SaleRecord(
    id: 'sale-test-1',
    shiftId: shift.id,
    status: SaleRecordStatus.completed,
    createdAt: DateTime.utc(2026, 8, 5, 15, 30),
    lines: const <SaleLineSnapshot>[
      SaleLineSnapshot(
        productId: 'p1',
        name: 'Produto teste',
        quantity: 1,
        unitPriceCents: 2590,
        lineTotalCents: 2590,
      ),
    ],
    payments: const <SalePaymentSnapshot>[
      SalePaymentSnapshot(
        methodId: 'cash',
        methodLabel: 'Dinheiro',
        amountCents: 2590,
      ),
    ],
    subtotalCents: 2590,
    totalCents: 2590,
    cashReceivedCents: 2590,
    changeCents: 0,
    cashNetCents: 2590,
  );
}

void main() {
  testWidgets('turno sem vendas mostra o vazio da tabela', (
    WidgetTester tester,
  ) async {
    await pumpWithRouter(
      tester,
      initialLocation: PdvRoutes.salesHistory,
      withOpenShift: true,
    );

    expect(find.byType(SalesHistoryPage), findsOneWidget);
    expect(find.text('Sem dados para mostrar'), findsOneWidget);
  });

  testWidgets('cabeçalho da tabela traz as sete colunas', (
    WidgetTester tester,
  ) async {
    await pumpWithRouter(
      tester,
      initialLocation: PdvRoutes.salesHistory,
      withOpenShift: true,
    );

    for (final String column in <String>[
      'Código',
      'Data / Hora',
      'Cliente',
      'Número',
      'Valor',
      'Nota Fiscal',
      'Ações',
    ]) {
      expect(find.text(column), findsOneWidget, reason: 'coluna $column');
    }
  });

  testWidgets('com vendas no turno, exibe o total formatado', (
    WidgetTester tester,
  ) async {
    final ProviderContainer container = await pumpWithRouter(
      tester,
      initialLocation: PdvRoutes.home,
      withOpenShift: true,
    );

    final CashShift shift = container.read(cashShiftProvider)!;
    await container
        .read(cashShiftProvider.notifier)
        .recordSale(_sampleSale(shift));

    await tester.tap(find.text('ÚLTIMAS VENDAS'));
    await tester.pumpAndSettle();

    expect(find.byType(SalesHistoryPage), findsOneWidget);
    expect(find.text(formatCents(2590)), findsOneWidget);
    expect(find.text('Sem dados para mostrar'), findsNothing);
    // Código = sequência do turno (não o id interno/UUID).
    expect(find.text('1'), findsOneWidget);
    expect(find.text('sale-test-1'), findsNothing);
    expect(find.text('Consumidor Final'), findsOneWidget);
  });
}
