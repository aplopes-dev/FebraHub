import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:citybox_pdv/features/cash/application/cash_shift_controller.dart';
import 'package:citybox_pdv/features/cash/domain/sale_record.dart';
import 'package:citybox_pdv/features/credit/application/credit_controller.dart';
import 'package:citybox_pdv/features/refund/data/shared_preferences_refund_store.dart';
import 'package:citybox_pdv/features/refund/domain/refund_models.dart';

final Provider<SharedPreferencesRefundStore?> refundStoreProvider =
    Provider<SharedPreferencesRefundStore?>((Ref ref) => null);

final NotifierProvider<RefundController, List<RefundRecord>> refundProvider =
    NotifierProvider<RefundController, List<RefundRecord>>(
      RefundController.new,
    );

class RefundController extends Notifier<List<RefundRecord>> {
  SharedPreferencesRefundStore? _store;

  @override
  List<RefundRecord> build() => const <RefundRecord>[];

  Future<void> hydrate() async {
    SharedPreferencesRefundStore? store = ref.read(refundStoreProvider);
    if (store == null) {
      final SharedPreferences prefs = await SharedPreferences.getInstance();
      store = SharedPreferencesRefundStore(prefs);
    }
    _store = store;
    state = await store.readAll();
  }

  int eligibleFor(SaleLineSnapshot line, String saleId) {
    return eligibleQty(line: line, priorRefunds: state, saleId: saleId);
  }

  Future<RefundRecord> confirmRefund({
    required SaleRecord sale,
    required List<RefundLine> lines,
    required RefundMethod method,
    String? customerId,
  }) async {
    if (lines.isEmpty) {
      throw ArgumentError('Selecione itens para devolver');
    }
    for (final RefundLine line in lines) {
      final SaleLineSnapshot? found = _findLine(sale, line.productId);
      if (found == null) {
        throw StateError('Item não pertence à venda');
      }
      final int eligible = eligibleFor(found, sale.id);
      if (line.quantity <= 0 || line.quantity > eligible) {
        throw ArgumentError('Quantidade inválida para ${line.name}');
      }
    }
    final int total = lines.fold(
      0,
      (int sum, RefundLine l) => sum + l.lineCents,
    );
    if (total <= 0) {
      throw ArgumentError('Total da devolução deve ser positivo');
    }

    final RefundRecord record = RefundRecord(
      id: DateTime.now().microsecondsSinceEpoch.toRadixString(16),
      saleId: sale.id,
      shiftId: sale.shiftId,
      createdAt: DateTime.now(),
      lines: lines,
      totalCents: total,
      method: method,
      customerId: customerId,
    );

    state = <RefundRecord>[...state, record];
    await _persist();

    if (method == RefundMethod.cash) {
      await ref
          .read(cashShiftProvider.notifier)
          .addWithdrawal(amountCents: total, reason: 'Devolução ${record.id}');
    } else if (method == RefundMethod.customerCredit && customerId != null) {
      await ref
          .read(creditProvider.notifier)
          .creditFromRefund(
            customerId: customerId,
            amountCents: total,
            refundId: record.id,
            shiftId: sale.shiftId,
          );
    }

    return record;
  }

  SaleLineSnapshot? _findLine(SaleRecord sale, String productId) {
    for (final SaleLineSnapshot s in sale.lines) {
      if (s.productId == productId) {
        return s;
      }
    }
    return null;
  }

  Future<void> _persist() async {
    final SharedPreferencesRefundStore? store = _store;
    if (store == null) {
      return;
    }
    await store.writeAll(state);
  }
}
