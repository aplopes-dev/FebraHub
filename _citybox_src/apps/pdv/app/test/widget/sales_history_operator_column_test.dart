import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/core/theme/pdv_theme.dart';
import 'package:citybox_pdv/features/cash/domain/cash_enums.dart';
import 'package:citybox_pdv/features/cash/domain/sale_record.dart';
import 'package:citybox_pdv/features/sales_history/presentation/widgets/sales_history_table.dart';

/// A coluna de operador mostra **traço** quando não há operador — nunca vazio
/// nem `0`, que se confundem com dado real.
///
/// Venda com `number: 5` de propósito: assim a única outra célula que desenha
/// traço é a de Nota Fiscal (que não existe no app), e a contagem de `—` vira
/// asserção precisa em vez de aproximada.
SaleRecord _sale({String? operatorName}) {
  return SaleRecord(
    id: 'sale-1',
    number: 5,
    operatorName: operatorName,
    operatorId: operatorName == null ? null : 'op-1',
    shiftId: 'shift',
    status: SaleRecordStatus.completed,
    createdAt: DateTime(2026, 8, 6, 10),
    lines: const <SaleLineSnapshot>[],
    payments: const <SalePaymentSnapshot>[],
    subtotalCents: 1000,
    totalCents: 1000,
    cashReceivedCents: 1000,
    changeCents: 0,
    cashNetCents: 1000,
  );
}

Future<void> _pumpRow(WidgetTester tester, SaleRecord sale) async {
  await tester.pumpWidget(
    MaterialApp(
      theme: PdvTheme.data(),
      home: Scaffold(body: SalesHistoryRow(sale: sale, onOpen: () {})),
    ),
  );
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('venda com operador mostra o nome', (WidgetTester tester) async {
    await _pumpRow(tester, _sale(operatorName: 'Ana'));

    expect(find.text('Ana'), findsOneWidget);
    // Só a Nota Fiscal desenha traço nesta linha.
    expect(find.text('—'), findsOneWidget);
  });

  testWidgets('venda gravada antes do operador mostra traço', (
    WidgetTester tester,
  ) async {
    await _pumpRow(tester, _sale());

    // Operador + Nota Fiscal.
    expect(find.text('—'), findsNWidgets(2));
    expect(find.text('null'), findsNothing);
    expect(find.text('0'), findsNothing);
  });

  testWidgets('o cabeçalho anuncia a coluna', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: PdvTheme.data(),
        home: const Scaffold(body: SalesHistoryTableHeader()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Operador'), findsOneWidget);
    // Operador e Cliente convivem: são colunas diferentes.
    expect(find.text('Cliente'), findsOneWidget);
  });
}
