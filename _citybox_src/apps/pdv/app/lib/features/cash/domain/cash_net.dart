import 'package:citybox_pdv/features/payment/domain/payment_entry.dart';
import 'package:citybox_pdv/features/payment/domain/payment_summary.dart';

/// Dinheiro líquido da venda: recebido em cash − troco.
({int cashReceivedCents, int changeCents, int cashNetCents}) computeCashNet({
  required List<PaymentEntry> entries,
  required PaymentSummary summary,
}) {
  final int cashReceivedCents = entries
      .where((PaymentEntry e) => e.method.isCash)
      .fold(0, (int sum, PaymentEntry e) => sum + e.amountCents);

  final int changeCents = summary.changeCents;
  final int cashNetCents =
      cashReceivedCents > 0
          ? (cashReceivedCents - changeCents).clamp(0, cashReceivedCents)
          : 0;

  return (
    cashReceivedCents: cashReceivedCents,
    changeCents: changeCents,
    cashNetCents: cashNetCents,
  );
}
