import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/features/counter/application/counter_cart_controller.dart';
import 'package:citybox_pdv/features/counter/domain/sale_adjustment.dart';

final NotifierProvider<SaleAdjustmentController, SaleAdjustment?>
saleAdjustmentProvider =
    NotifierProvider<SaleAdjustmentController, SaleAdjustment?>(
      SaleAdjustmentController.new,
    );

class SaleAdjustmentController extends Notifier<SaleAdjustment?> {
  @override
  SaleAdjustment? build() {
    ref.listen(counterCartProvider, (previous, next) {
      if (next.isEmpty && state != null) {
        state = null;
      }
    });
    return null;
  }

  /// Define o único ajuste da venda (substitui qualquer anterior — XOR).
  void setAdjustment(SaleAdjustment adjustment) {
    state = adjustment;
  }

  void clear() => state = null;
}
