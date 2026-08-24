import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/features/counter/application/counter_totals_provider.dart';
import 'package:citybox_pdv/features/counter/domain/counter_totals.dart';
import 'package:citybox_pdv/features/payment/application/payment_entries_controller.dart';
import 'package:citybox_pdv/features/payment/domain/payment_entry.dart';
import 'package:citybox_pdv/features/payment/domain/payment_summary.dart';

/// Recebido, a receber e troco — recalculados a cada pagamento lançado.
final Provider<PaymentSummary> paymentSummaryProvider =
    Provider<PaymentSummary>((Ref ref) {
      final CounterTotals totals = ref.watch(counterTotalsProvider);
      final List<PaymentEntry> entries = ref.watch(paymentEntriesProvider);

      final int receivedCents = entries.fold(
        0,
        (int sum, PaymentEntry entry) => sum + entry.amountCents,
      );

      return PaymentSummary(
        totalCents: totals.totalCents,
        receivedCents: receivedCents,
      );
    });
